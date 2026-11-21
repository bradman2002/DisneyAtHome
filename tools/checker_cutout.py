"""Cut an illustration out of a baked-in checkerboard (an AI image saved without real transparency). Pure Python, no PIL.
usage: sips -s format bmp in.jpg --out /tmp/x.bmp ; python3 tools/checker_cutout.py /tmp/x.bmp images/out.png
The grid (PX, X0, PY, Y0) and checker colours are the ones measured for castle-dl.png; measure again for another image."""
import sys,struct,zlib,math
from collections import deque
src,out=sys.argv[1],sys.argv[2]
b=open(src,'rb').read();off=struct.unpack_from('<I',b,10)[0];w,h=struct.unpack_from('<ii',b,18);h=abs(h);row=(w*3+3)&~3
R=bytearray(w*h);G=bytearray(w*h);B=bytearray(w*h)
for y in range(h):
  r0=off+y*row
  for x in range(w):i=r0+x*3;j=y*w+x;B[j]=b[i];G[j]=b[i+1];R[j]=b[i+2]
PX,X0,PY,Y0=11.458,12,11.45,8
def cell(x,y):return (math.floor((x-X0)/PX)+1+math.floor((y-Y0)/PY)+1)&1
wp=cell(5,5) if R[5*w+5]>200 else 1-cell(5,5)
def edge(x,y):
  fx=((x-X0)/PX)%1;fy=((y-Y0)/PY)%1
  return min(fx,1-fx)*PX<2.6 or min(fy,1-fy)*PY<2.6
def bg(j):
  x=j%w;y=j//w;r,g,bb=R[j],G[j],B[j];mx=max(r,g,bb);mn=min(r,g,bb);ch=mx-mn
  if ch>16:return False
  if edge(x,y):return mn>=118
  if cell(x,y)==wp:return mn>=226
  return abs(r-140)<15 and abs(g-141)<15 and abs(bb-134)<15
M=bytearray(w*h);q=deque()
for x in range(w):
  for y in (0,h-1):
    j=y*w+x
    if not M[j] and bg(j):M[j]=1;q.append(j)
for y in range(h):
  for x in (0,w-1):
    j=y*w+x
    if not M[j] and bg(j):M[j]=1;q.append(j)
while q:
  j=q.popleft();x=j%w;y=j//w
  for k in ((j-1) if x>0 else -1,(j+1) if x<w-1 else -1,(j-w) if y>0 else -1,(j+w) if y<h-1 else -1):
    if k>=0 and not M[k] and bg(k):M[k]=1;q.append(k)
# pockets of checkerboard shut in by the castle (between towers): background-coloured regions with both kinds of square
def kind(j):
  r,g,bb=R[j],G[j],B[j];ch=max(r,g,bb)-min(r,g,bb)
  if ch>16:return -1
  mn=min(r,g,bb)
  if mn>=222:return 1
  if 124<=mn and max(r,g,bb)<=162:return 2
  if mn>=150:return 0
  return -1
for s0 in range(w*h):
  if M[s0] or kind(s0)<0:continue
  comp=[s0];M[s0]=2;k=0;nw=ng=0
  while k<len(comp):
    j=comp[k];k+=1;x=j%w;y=j//w;kk=kind(j);nw+=kk==1;ng+=kk==2
    for n in ((j-1) if x>0 else -1,(j+1) if x<w-1 else -1,(j-w) if y>0 else -1,(j+w) if y<h-1 else -1):
      if n>=0 and not M[n] and kind(n)>=0:M[n]=2;comp.append(n)
  keep=nw>40 and ng>40 and nw>len(comp)*.25 and ng>len(comp)*.2 and len(comp)<4000
  for j in comp:M[j]=1 if keep else 3
for j in range(w*h):
  if M[j]==3:M[j]=0
# small enclosed specks of background colour fully surrounded? keep. Remove tiny islands of foreground (<40 px)
A=bytearray(w*h)
for j in range(w*h):A[j]=0 if M[j] else 255
seen=bytearray(w*h)
for s in range(w*h):
  if A[s] and not seen[s]:
    comp=[s];seen[s]=1;k=0
    while k<len(comp):
      j=comp[k];k+=1;x=j%w;y=j//w
      for n in ((j-1) if x>0 else -1,(j+1) if x<w-1 else -1,(j-w) if y>0 else -1,(j+w) if y<h-1 else -1):
        if n>=0 and A[n] and not seen[n]:seen[n]=1;comp.append(n)
    if len(comp)<400:
      for j in comp:A[j]=0
# soften the outline: foreground pixels touching background get partial alpha
E=bytearray(A)
for y in range(1,h-1):
  for x in range(1,w-1):
    j=y*w+x
    if A[j]:
      n=(A[j-1]==0)+(A[j+1]==0)+(A[j-w]==0)+(A[j+w]==0)
      if n:E[j]=255-55*n
xs=[j%w for j in range(w*h) if E[j]];ys=[j//w for j in range(w*h) if E[j]]
x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys);print('bbox',x0,y0,x1,y1)
raw=bytearray()
for y in range(y0,y1+1):
  raw.append(0)
  for x in range(x0,x1+1):
    j=y*w+x;raw+=bytes((R[j],G[j],B[j],E[j]))
def chunk(t,d):c=struct.pack('>I',len(d))+t+d;return c+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',x1-x0+1,y1-y0+1,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b'')
open(out,'wb').write(png);print(len(png))
