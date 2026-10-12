# Portfolio art for the_protagonist07's itch profile. Run from the repo root after make_art.py.
import sys; sys.argv=['x']
exec(open('marketing/make_art.py').read().split('# logo')[0])   # reuse helpers (font, glow_text, vignette, fit, paste_c)
from PIL import Image, ImageDraw, ImageFilter
PH='/Users/theprotagonist/pixel-hopper/marketing/branding/cover_630x500.png'
SW='marketing/branding/cover_630x500.png'

# avatar 512: Wren with a lantern glow
av=Image.new('RGBA',(512,512),(16,18,42,255)); g=Image.new('RGBA',(512,512),(0,0,0,0))
ImageDraw.Draw(g).ellipse((56,76,456,476),fill=(255,170,70,170)); av.alpha_composite(g.filter(ImageFilter.GaussianBlur(60)))
paste_c(av,hero.resize((288,288),Image.NEAREST),256,270); av=vignette(av,0.55); av.convert('RGB').save('marketing/portfolio/avatar_512.png')

# profile banner 1920x480: both games side by side
W,H=1920,480
bn=fit(Image.open(SW).convert('RGB'),W,H,(0.5,0.4)).filter(ImageFilter.GaussianBlur(18)).convert('RGBA')
bn=ImageEnhance.Brightness(bn).enhance(0.35)
def card(path,cx):
    c=Image.open(path).convert('RGBA'); c.thumbnail((470,380),Image.LANCZOS)
    sh=Image.new('RGBA',(c.width+60,c.height+60),(0,0,0,0)); ImageDraw.Draw(sh).rectangle((30,38,30+c.width,38+c.height),fill=(0,0,0,170))
    sh=sh.filter(ImageFilter.GaussianBlur(14)); paste_c(bn,sh,cx,250)
    fr=Image.new('RGBA',(c.width+12,c.height+12),(255,214,130,255)); paste_c(bn,fr,cx,240); paste_c(bn,c,cx,240)
card(PH,430); card(SW,1490)
mid=glow_text(64,'SMALL GAMES'); paste_c(bn,mid,960,170)
sub=glow_text(30,'for your browser',color=(220,230,255),gl=(90,120,200)); paste_c(bn,sub,960,262)
d=ImageDraw.Draw(bn); f=font(26); t='by the_protagonist07'; b=d.textbbox((0,0),t,font=f); d.text((960-(b[2]-b[0])/2,330),t,font=f,fill=(255,214,130,255))
bn.convert('RGB').save('marketing/portfolio/profile_banner_1920x480.png')
print('ok')
