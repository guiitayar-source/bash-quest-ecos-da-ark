"""Draw the ARK exterior, crew portraits and uniform variants."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
import random

OUT = Path(__file__).resolve().parents[1] / 'public' / 'art'
rng = random.Random(197)
W, H = 800, 450
im = Image.new('RGB', (W,H))
d = ImageDraw.Draw(im)
for y in range(H):
    for x in range(W):
        glow = max(0, 1-math.hypot((x-607)/590,(y-241)/243))
        band = round(glow*32)/32
        grain = rng.choice([-3, 0, 0, 0, 3])
        im.putpixel((x,y), (int(24+173*band+grain), int(33+69*band+grain), int(39+17*band+grain)))

# Late sunlight and belts of ash.
d.ellipse((553,110,663,220), fill='#ffc88a')
d.ellipse((555,111,661,218), fill='#efad72')
for y in range(152,220,7):
    width = int(math.sqrt(max(0, 54**2-(y-165)**2)))
    d.rectangle((608-width,y,608+width,y+1),fill='#e7a679')
for i in range(182):
    y = rng.randrange(30,276)
    x = rng.randrange(30,794)
    streak = rng.randrange(2,66)
    a, b, c = im.getpixel((x,y))
    tint = rng.randrange(-16,14)
    d.line((x,y,min(x+streak,799),y), fill=(max(0,a+tint),max(0,b+tint),max(0,c+tint)))

def ridge(base, color, seed, amplitude, stride):
    r = random.Random(seed)
    line = [(x, int(base + math.sin(x/96+seed)*amplitude*.6+r.randrange(-amplitude,amplitude))) for x in range(0,W+stride,stride)]
    d.polygon(line+[(W,H),(0,H)],fill=color)
    for (x1,y1),(x2,y2) in zip(line,line[1:]):
        d.line((x1,y1,x2,y2),fill=tuple(min(255,int(color[i:i+2],16)+8) for i in (1,3,5)))
    return line
ridge(239,'#76645b',12,20,16)
ridge(274,'#53494a',9,26,15)
# Ruined pylons jut out of the valley.
for x,y,tall in [(640,225,46),(673,233,23),(701,224,61),(742,258,42),(769,247,65),(310,238,27)]:
    d.polygon([(x,y),(x+9,y-tall),(x+16,y),(x+13,y),(x+9,y-tall+12),(x+3,y)],fill='#423d40')
    for k in range(7,tall,11):
        d.line((x+3,y-k,x+14,y-k-3),fill='#493f40')
ridge(331,'#3b3b3a',20,31,18)
ridge(384,'#222e2f',14,32,16)

# ARK built into a rock shelf. Modules share the same panel seams as the game.
d.polygon([(376,335),(437,310),(526,312),(571,305),(630,327),(704,336),(722,380),(586,407),(387,394)],fill='#22272a')
d.polygon([(389,352),(434,337),(510,345),(585,329),(676,350),(704,367),(593,386),(420,377)],fill='#41403b')
d.polygon([(442,318),(460,255),(505,230),(587,243),(632,268),(649,326),(570,353),(469,348)],fill='#242e31')
d.polygon([(461,256),(506,229),(587,242),(630,266),(566,288),(463,276)],fill='#77736a')
d.polygon([(473,258),(510,238),(586,247),(613,265),(562,281),(476,270)],fill='#535858')
d.polygon([(465,278),(565,291),(566,348),(469,336),(447,318)],fill='#464d4a')
d.polygon([(568,290),(630,271),(646,326),(568,348)],fill='#354647')
for x in range(473,562,15):
    y = 280+(x-467)//8
    d.polygon([(x,y),(x+8,y+1),(x+8,y+44),(x,y+41)],fill='#282f31')
    d.line((x+1,y+2,x+1,y+39),fill='#777970')
    d.line((x+2,y+15,x+6,y+15),fill='#eca564',width=2)
for x in range(574,636,11):
    y = 288-(x-570)//4
    d.line((x,y+2,x+5,y+37),fill='#1b2426',width=3)
    d.line((x+3,y+5,x+7,y+34),fill='#526561',width=2)
d.polygon([(557,318),(575,316),(575,350),(558,354)],fill='#1c302f')
d.line((560,319,573,316,573,343),fill='#9fceac',width=2)
d.polygon([(557,355),(577,350),(613,371),(579,379)],fill='#696454')
for y in range(358,376,4):
    d.line((564+(y-358),y,596+(y-358)//2,y-4),fill='#756c59')
# Antenna masts and their night beacons.
for x,y,h in [(521,242,63),(541,249,46),(584,255,43),(490,247,28)]:
    d.line((x,y,x+2,y-h),fill='#252a2d',width=3)
    d.line((x,y-h+7,x+2,y-h),fill='#aaa293')
    d.line((x-8,y-h+12,x+11,y-h+10),fill='#323b3d',width=2)
    d.point((x+2,y-h),fill='#ffd096')
d.arc((535,190,597,230),5,173,fill='#383c3c',width=3)
d.line((543,213,570,224,592,208),fill='#a19380',width=2)
d.line((570,223,571,241),fill='#2e3335',width=4)
# Foreground gravel and faint embers in the valley.
for _ in range(720):
    x,y=rng.randrange(W),rng.randrange(366,H)
    if rng.random()<.88 and 420<x<710 and y<387:continue
    c=rng.choice(['#293436','#424440','#1e2b2c','#67534b'])
    d.line((x,y,x+rng.randrange(1,10),y),fill=c)
for x,y in [(506,369),(541,366),(593,383),(621,373),(634,376),(685,372)]:
    d.rectangle((x,y,x+2,y+1),fill='#db9c62')
im.save(OUT/'frontier.png')

for variant, colors in {
    'ochre':None,
    'teal':('#3d7b73','#80c7a9','#b7e0bf'),
    'plum':('#76567b','#c198c6','#e3c4dd'),
}.items():
    for i in range(3):
        sprite=Image.open(OUT/f'crew-{i}.png').convert('RGBA')
        if colors:
            tone=dict(zip(['#986c42','#e3a857','#f3d197'],colors))
            for y in range(sprite.height):
                for x in range(sprite.width):
                    pixel=sprite.getpixel((x,y))
                    replacement=tone.get('#%02x%02x%02x' % pixel[:3])
                    if replacement and pixel[3]:
                        sprite.putpixel((x,y),tuple(bytes.fromhex(replacement[1:]))+(255,))
        sprite.save(OUT/f'player-{variant}-{i}.png')

# Two distinct faces, silhouettes and work outfits.
def portrait(person, skin, shade, hair, top, scarf):
    im=Image.new('RGBA',(56,56))
    p=ImageDraw.Draw(im)
    p.polygon([(7,55),(8,44),(18,39),(23,37),(34,37),(43,40),(49,46),(50,55)],fill='#172429')
    p.polygon([(10,55),(11,45),(24,40),(35,40),(45,45),(47,55)],fill=top)
    p.polygon([(13,14),(19,7),(33,7),(41,14),(42,30),(36,39),(21,40),(15,34)],fill=hair)
    p.polygon([(17,20),(21,15),(33,15),(39,21),(39,31),(34,38),(24,38),(18,31)],fill=skin)
    p.polygon([(31,16),(37,19),(39,23),(38,33),(33,38),(28,37),(34,32),(34,23)],fill=shade)
    p.line((20,24,25,24),fill='#242627',width=2);p.line((31,24,35,24),fill='#242627',width=2)
    p.line((27,30,30,30),fill=shade);p.line((25,34,31,34),fill='#8d514f')
    if person=='lara':
        p.polygon([(14,16),(19,8),(33,7),(40,14),(37,17),(29,13),(24,19),(17,22),(16,33),(13,29)],fill=hair)
        p.polygon([(13,24),(17,28),(15,37),(16,42),(10,39),(10,32)],fill=hair)
        p.polygon([(20,38),(34,38),(38,42),(29,49),(22,45)],fill=scarf)
        p.point((36,31),fill='#f6ce80')
    else:
        p.polygon([(16,14),(20,9),(35,9),(40,14),(39,20),(33,17),(19,18),(17,23)],fill=hair)
        p.line((19,22,37,22),fill='#536462',width=2)
        p.rectangle((20,22,25,25),outline='#343f40');p.rectangle((30,22,36,25),outline='#343f40')
        p.polygon([(20,33),(25,36),(34,35),(37,31),(37,36),(32,39),(25,39)],fill=hair)
        p.rectangle((29,42,34,53),fill=scarf)
    p.rectangle((14,49,19,51),fill='#e7c48a')
    im.save(OUT/f'portrait-{person}.png')
    sprite=Image.new('RGBA',(22,25))
    g=ImageDraw.Draw(sprite)
    g.ellipse((3,0,18,15),fill='#171f24')
    g.polygon([(1,20),(2,15),(7,12),(15,12),(19,15),(20,20)],fill=top)
    g.rectangle((7,4,14,12),fill=skin);g.rectangle((9,3,15,5),fill=hair)
    g.line((9,8,10,8),fill='#302e2c');g.line((13,8,14,8),fill='#302e2c')
    g.rectangle((7,12,15,14),fill=scarf)
    g.rectangle((6,18,9,23),fill='#344148');g.rectangle((12,18,15,23),fill='#344148')
    g.line((6,23,9,23),fill='#172229');g.line((12,23,15,23),fill='#172229')
    sprite.save(OUT/f'npc-{person}.png')

portrait('lara','#d39570','#a46a59','#3b2930','#597064','#c7915f')
portrait('noah','#b87f61','#925c4f','#292e31','#596c73','#81ab9b')
