# Windows launcher for the simulator: serves this folder on http://localhost (no install needed: it uses
# PowerShell, which comes with Windows) and opens the site. Started by "Start Simulator.bat" and "Start TV.bat".
#   -Tv   open full screen in TV mode (Microsoft Edge kiosk, or Chrome if Edge isn't there), with sound allowed,
#         and keep the PC and screen awake while it runs.
param([switch]$Tv)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# a free port from 8000
$port = 8000
while ($port -lt 8100) {
  try { $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port); $probe.Start(); $probe.Stop(); break }
  catch { $port++ }
}
$prefix = "http://localhost:$port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml'; '.ico'='image/x-icon';
  '.mp3'='audio/mpeg'; '.m4a'='audio/mp4'; '.ogg'='audio/ogg'; '.wav'='audio/wav'; '.txt'='text/plain; charset=utf-8' }

$stamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$url = if ($Tv) { "${prefix}?tv&v=$stamp" } else { "${prefix}?v=$stamp" }
Write-Host "Magic Kingdom Simulator running at $prefix"

$browser = $null
if ($Tv) {
  # keep the PC and the screen awake while this window is open
  Add-Type -Namespace Win32 -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
  [Win32.Power]::SetThreadExecutionState([uint32]'0x80000003') | Out-Null   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
  $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  $chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LocalAppData\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  # its own browser profile, so your normal browser windows are untouched; kiosk = full screen with no bars
  $profileDir = Join-Path $env:LocalAppData 'MagicKingdomTV'
  $common = @("--user-data-dir=`"$profileDir`"", '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--disable-session-crashed-bubble', '--kiosk', $url)
  if ($edge) { $browser = Start-Process -FilePath $edge -ArgumentList (@('--edge-kiosk-type=fullscreen') + $common) -PassThru }
  elseif ($chrome) { $browser = Start-Process -FilePath $chrome -ArgumentList $common -PassThru }
  else { Start-Process $url; Write-Host 'No Edge or Chrome found: in the browser, click the page once and press T.' }
  Write-Host 'To stop: press Alt+F4 in the full-screen window, then close this window.'
} else {
  Start-Process $url
  Write-Host 'Leave this window open while you use the site. Close it to stop.'
}

# serve files until the window is closed (no caching, so you always get the newest files)
try {
  while ($listener.IsListening) {
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(500)) {
      if ($browser -and $browser.HasExited) { $listener.Stop(); break }   # TV window closed: stop the server too
    }
    if (-not $listener.IsListening) { break }
    $ctx = $task.Result
    $res = $ctx.Response
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($path -eq '') { $path = 'index.html' }
      $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
      if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $file -PathType Leaf)) {
        $res.StatusCode = 404
      } else {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store, must-revalidate')
        $res.Headers.Add('Accept-Ranges', 'bytes')
        $fs = [System.IO.File]::OpenRead($file)
        try {
          $len = $fs.Length; $start = 0; $end = $len - 1
          $range = $ctx.Request.Headers['Range']
          if ($range -match '^bytes=(\d*)-(\d*)$') {   # lets the browser jump around in long music files
            if ($Matches[1] -ne '') { $start = [int64]$Matches[1] }
            if ($Matches[2] -ne '') { $end = [Math]::Min([int64]$Matches[2], $len - 1) }
            elseif ($Matches[1] -eq '') { $start = [Math]::Max(0, $len - [int64]$Matches[2]) }
            $res.StatusCode = 206
            $res.Headers.Add('Content-Range', "bytes $start-$end/$len")
          }
          $res.ContentLength64 = $end - $start + 1
          if ($ctx.Request.HttpMethod -ne 'HEAD') {
            $fs.Position = $start; $buf = New-Object byte[] 65536; $left = $end - $start + 1
            while ($left -gt 0) { $n = $fs.Read($buf, 0, [int][Math]::Min($buf.Length, $left)); if ($n -le 0) { break }; $res.OutputStream.Write($buf, 0, $n); $left -= $n }
          }
        } finally { $fs.Close() }
      }
    } catch { }   # the browser hung up mid-file (normal when it skips through music): carry on
    finally { try { $res.Close() } catch { } }
  }
} finally {
  if ($listener.IsListening) { $listener.Stop() }
}
