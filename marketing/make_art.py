# Builds the itch.io page art from captured in-game frames (marketing/raw) and the game's own CC0 font and sprites.
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os
R='marketing/raw/'; F='public/assets/fonts/kenney-pixel-square.ttf'
def load(n): return Image.open(R+n+'.png').convert('RGB')
def font(sz): return ImageFont.truetype(F, sz)
def fit(im,w,h,anchor=(0.5,0.6)):
    s=max(w/im.width,h/im.height); im=im.resize((round(im.width*s),round(im.height*s)),Image.BICUBIC)
    x=round((im.width-w)*anchor[0]); y=round((im.height-h)*anchor[1]); return im.crop((x,y,x+w,y+h))
def glow_text(size,text,color=(255,214,130),gl=(255,150,60)):
    f=font(size); d=ImageDraw.Draw(Image.new('L',(1,1))); b=d.textbbox((0,0),text,font=f)
    w,h=b[2]-b[0]+size, b[3]-b[1]+size; im=Image.new('RGBA',(w,h),(0,0,0,0))
    g=Image.new('RGBA',(w,h),(0,0,0,0)); ImageDraw.Draw(g).text((size//2-b[0],size//2-b[1]),text,font=f,fill=gl+(255,))
    im=Image.alpha_composite(im,g.filter(ImageFilter.GaussianBlur(size/5)))
    im=Image.alpha_composite(im,g.filter(ImageFilter.GaussianBlur(size/14)))
    dd=ImageDraw.Draw(im); dd.text((size//2-b[0]+max(2,size//18),size//2-b[1]+max(2,size//18)),text,font=f,fill=(40,20,50,255))
    dd.text((size//2-b[0],size//2-b[1]),text,font=f,fill=color+(255,)); return im
def paste_c(base,im,cx,cy): base.alpha_composite(im,(round(cx-im.width/2),round(cy-im.height/2)))
def vignette(im,k=0.55):
    w,h=im.size; m=Image.new('L',(w,h),0); ImageDraw.Draw(m).ellipse((-w*.25,-h*.35,w*1.25,h*1.35),fill=255); m=m.filter(ImageFilter.GaussianBlur(min(w,h)/4))
    return Image.composite(im,ImageEnhance.Brightness(im).enhance(k),m)
hero=Image.open('public/assets/art/characters.png').convert('RGBA').crop((6*24,0,7*24,24))

# logo
logo=Image.new('RGBA',(900,300),(0,0,0,0))
paste_c(logo,glow_text(110,'STAYING'),450,95); paste_c(logo,glow_text(110,'WARM'),450,215)
logo=logo.crop(logo.getbbox()); logo.save('marketing/branding/logo.png')

# icon
ic=fit(load('k1_orchard'),512,512,(0.5,0.55)).convert('RGBA'); ic=ImageEnhance.Brightness(ic).enhance(0.85)
hs=hero.resize((288,288),Image.NEAREST); paste_c(ic,hs,256,270); ic=vignette(ic,0.6)
ic.convert('RGB').save('marketing/branding/icon_512.png')

# cover 630x500
cv=fit(load('k2_cold'),630,500,(0.5,0.62)).convert('RGBA'); cv=vignette(cv,0.5)
lg=logo.copy(); lg.thumbnail((560,180),Image.LANCZOS); paste_c(cv,lg,315,110)
f=font(22); d=ImageDraw.Draw(cv); t='A short story platformer'; b=d.textbbox((0,0),t,font=f); d.text((315-(b[2]-b[0])/2,450),t,font=f,fill=(200,215,255,255))
cv.convert('RGB').save('marketing/branding/cover_630x500.png')

# page background 2560x1100 (soft, dark, scenery only)
ks=[load('k1_orchard'),load('k2_cold'),load('k3_rise')]
strip=Image.new('RGB',(960*3,540))
for i,k in enumerate(ks): strip.paste(k,(i*960,0))
bg=fit(strip,2560,1100,(0.5,0.5)).filter(ImageFilter.GaussianBlur(5)); bg=ImageEnhance.Brightness(bg).enhance(0.55)
bg=bg.convert('RGBA'); bg=vignette(bg,0.4)
bg.convert('RGB').save('marketing/page/page_background_2560x1100.png')

# banner 1920x420 (title strip with logo)
bn=fit(strip,1920,420,(0.5,0.75)).convert('RGBA'); bn=ImageEnhance.Brightness(bn).enhance(0.7)
one=glow_text(130,'STAYING WARM'); paste_c(bn,one,960,190)
bn=vignette(bn,0.5); bn.convert('RGB').save('marketing/page/banner_1920x420.png')

# embed cover 960x540 (launch screen behind the Run game button)
em=load('k3_rise').convert('RGBA'); em=ImageEnhance.Brightness(em).enhance(0.6); em=vignette(em,0.5)
lg=logo.copy(); lg.thumbnail((620,210),Image.LANCZOS); paste_c(em,lg,480,200)
d=ImageDraw.Draw(em); f=font(24)
for t,y,c in (('Light every lantern. Stay warm.',340,(220,230,255,255)),):
    b=d.textbbox((0,0),t,font=f); d.text((480-(b[2]-b[0])/2,y),t,font=f,fill=c)
em.convert('RGB').save('marketing/page/embed_cover_960x540.png')

# screenshots in order
order=[('c1_orchard','01_orchard_lantern'),('c5_pip','02_meet_pip'),('c2_cold','03_cold_road'),('c3_rise','04_hearth_rise'),('c4_door','05_summit_door'),('t2_hearth','06_relight_hearth'),('t1_title','07_title'),('t3_end','08_the_end')]
for a,b in order: load(a).save(f'marketing/screenshots/{b}.png')
print('ok')
