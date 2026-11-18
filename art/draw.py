"""Draw the original ARK tile scenery and crew sprites at native pixel resolution."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
from pathlib import Path
import random, math
OUT=Path(__file__).resolve().parents[1]/'public'/'art'
OUT.mkdir(exist_ok=True)
TINY=ImageFont.load_default(size=8)
def box(x,y,w,h,c):
    if w>0 and h>0: d.rectangle((x,y,x+w-1,y+h-1),fill=c)
def line(pts,c,w=1): d.line(pts,fill=c,width=w)
def poly(pts,c): d.polygon(pts,fill=c)
def dot(x,y,c): d.point((x,y),fill=c)
def cham(x,y,w,h,k,c):
    poly([(x+k,y),(x+w-k-1,y),(x+w-1,y+k),(x+w-1,y+h-k-1),(x+w-k-1,y+h-1),(x+k,y+h-1),(x,y+h-k-1),(x,y+k)],c)
def label(x,y,t,c): d.text((x,y),t,font=TINY,fill=c,stroke_width=0)
def grate(x,y,w,h):
    box(x,y,w,h,'#101b24');box(x+1,y+1,w-2,1,'#727f74')
    for i in range(x+3,x+w-2,4):
        box(i,y+2,2,h-4,'#36454c');box(i,y+2,1,h-5,'#59676a')
def panel(x,y,w,h,c='#42515b'):
    cham(x,y+2,w,h,3,'#111b24');cham(x,y,w,h,3,'#273640');cham(x+1,y+1,w-2,h-4,2,c)
    box(x+4,y+1,w-8,1,'#81928f');box(x+4,y+h-4,w-8,1,'#1d2d36')
    for a in [x+4,x+w-5]:
        for b in [y+4,y+h-6]: dot(a,b,'#172631')
def stripes(x,y,w,h):
    box(x,y,w,h,'#302f27')
    for i in range(0,w-4,8):
        for j in range(h): box(x+i+(h-j)//2,y+j,min(4,w-i),1,'#b18446')
def tube(x1,y1,x2,y2,r=5):
    line([(x1,y1+2),(x2,y2+2)],'#131e29',r+2)
    line([(x1,y1),(x2,y2)],'#485760',r)
    line([(x1-1,y1-1),(x2-1,y2-1)],'#828984',max(1,r//3))
    for t in range(5,max(abs(x1-x2),abs(y1-y2)),14):
        if y1==y2:box(x1+t,y1-r//2,3,r+1,'#303e47');box(x1+t+1,y1-r//2,1,r+1,'#68716f')
        else:box(x1-r//2,y1+t,r+1,3,'#31404a')
def screen(x,y,w,h,bright=True):
    panel(x-3,y-3,w+6,h+7,'#566563');box(x-1,y-1,w+2,h+2,'#091816');box(x,y,w,h,'#225249' if bright else '#20333b')
    for j in range(2,h-2,3):
        a=R.randint(2,max(2,w-5));box(x+2,y+j,a,1,R.choice(['#69be99','#94d4a3','#3f8a76']) if bright else '#38515b')
    box(x+w-4,y+h+2,2,1,'#b9eb9a' if bright else '#dba05a')
def console(x,y,w=65):
    # Back upright monitors, sloped control surface and inset legs.
    poly([(x-4,y+20),(x+w+5,y+20),(x+w+10,y+26),(x,y+26)],'#1d2a32')
    panel(x,y-19,w,40,'#46575b');box(x+4,y+12,w-8,10,'#263640')
    screen(x+6,y-14,w//2-5,12);screen(x+w//2+6,y-14,w//2-12,12)
    poly([(x+1,y+2),(x+w-2,y+2),(x+w+3,y+10),(x-3,y+10)],'#88938a')
    box(x-2,y+10,w+5,3,'#465754');box(x+3,y+13,4,9,'#566466');box(x+w-7,y+13,4,9,'#536062')
    box(x+6,y+4,20,5,'#324740')
    for i in range(6):box(x+8+3*i,y+5,2,1,'#a4b5a0');box(x+9+3*i,y+7,2,1,'#839783')
    for i in range(4):box(x+w-26+5*i,y+6,3,2,['#dfab5e','#749983','#b8e092','#526565'][i])
    grate(x+14,y+13,w-28,7)
def crate(x,y,w=26):
    cham(x+3,y+4,w,17,3,'#1b2930');panel(x,y,w,19,'#77654b');box(x+3,y+4,w-6,6,'#a48b63')
    line([(x+4,y+13),(x+w-6,y+13)],'#4d493c',2)
    for k in [5,w-8]:box(x+k,y+1,3,16,'#465252');box(x+k,y+2,1,7,'#99a092')
    box(x+w//2-3,y+10,6,3,'#d4bd83')
def bed(x,y):
    cham(x+3,y+4,73,36,7,'#202d36');cham(x,y,72,37,6,'#182630')
    cham(x+1,y,70,32,6,'#74868a');cham(x+3,y+2,66,27,5,'#a9ada0')
    cham(x+6,y+4,60,22,6,'#31434b');cham(x+7,y+5,58,18,5,'#44616b')
    # Capsule glazing and folded padded blanket.
    cham(x+9,y+6,15,13,3,'#a3b8b1');box(x+10,y+7,12,2,'#c2c8b5')
    cham(x+25,y+6,33,14,3,'#62888a')
    for j in range(3):line([(x+26+j*8,y+7),(x+29+j*8,y+17)],'#7d9fa0',2)
    line([(x+9,y+22),(x+61,y+22)],'#75b8b7',1)
    for i in [3,63]:box(x+i,y+8,4,17,'#40545b');box(x+i,y+7,3,3,'#d0a36a')
    box(x+18,y+28,35,3,'#4c6269');box(x+7,y+29,7,2,'#8bc6ac')
def door(x,y,on):
    cham(x-4,y-4,46,38,6,'#18242d');cham(x-2,y-4,42,33,5,'#82918a');cham(x,y-2,38,31,5,'#33444d')
    cham(x+4,y,30,28,3,'#152835')
    if not on:
        for i in range(2):
            a=x+4+i*15;box(a,y+2,14,26,'#5a686d');box(a+1,y+3,12,3,'#738181')
            line([(a+1,y+12),(a+11,y+12),(a+13,y+14)],'#38494e',2);box(a+4,y+18,5,3,'#aa8560')
    else:
        for i in range(5):box(x+7,y+7+i*4,25,1,'#283b41')
    box(x+11,y-4,17,2,'#b8ee94' if on else '#cf934e');stripes(x,y+29,37,3)
def bank(x,y,w=45):
    panel(x,y,w,36,'#506174')
    for k in range(3):
        grate(x+4,y+4+9*k,w-8,8);box(x+w-12,y+6+9*k,2,2,'#e4ab66');box(x+w-8,y+6+9*k,2,2,'#91c39f')
def machine(x,y,n):
    panel(x,y,67,35,'#59666a');screen(x+6,y+5,22,12,n%2==0)
    for k in range(3):panel(x+34+k*9,y+3,8,20,'#736b59');box(x+36+k*9,y+8,4,7,'#c9a46f')
    grate(x+5,y+22,56,10)
def paint_room(n,on):
    global d,R
    R=random.Random(574+n)
    im=Image.new('RGB',(480,270),'#091016');d=ImageDraw.Draw(im)
    # Dark cutaway around the bunker interior.
    for i in range(210):
        x=R.randrange(480);y=R.randrange(270);dot(x,y,R.choice(['#12232b','#26353d','#445259','#84918d']))
        if i%47==0:line([(x-1,y),(x+1,y)],'#5d746e')
    # Hull silhouette, greebled outer rails, lower supports.
    shell=[(24,69),(49,43),(426,43),(455,68),(455,211),(430,237),(54,237),(24,206)]
    poly([(a,b+6) for a,b in shell],'#0c151f');poly(shell,'#28353f')
    line(shell+[shell[0]],'#506069',2)
    for x in range(54,425,27):
        box(x,230,20,9,'#1b2b37');box(x+1,231,18,2,'#45565e');grate(x+4,234,12,5)
    tube(66,43,411,43,5);tube(32,81,32,199,6);tube(447,82,447,199,6)
    # Upper wall mass and vertical structural bays.
    poly([(36,71),(58,50),(421,50),(443,73),(443,111),(37,111)],'#1a2935')
    for x in range(47,434,29):
        panel(x,58,27,47,'#43515b');box(x+3,64,20,2,'#53636b')
        box(x+5,91,16,8,'#33444e');box(x+7,93,10,1,'#617177')
    # The observation window looks onto the ash-covered slopes above the refuge.
    panel(128,51,147,43,'#647278');cham(132,54,139,34,5,'#766b62')
    for yy in range(57,84):
        shade=yy-57
        box(136,yy,131,1,(141-shade*2,112-shade,92-shade))
    d.ellipse((223,58,244,79),fill='#dea374')
    poly([(136,73),(154,68),(169,75),(189,65),(203,76),(228,74),(246,78),(266,70),(266,85),(136,85)],'#544f4d')
    poly([(136,82),(157,74),(175,79),(189,78),(222,84),(241,77),(266,79),(266,85),(136,85)],'#3a4444')
    for xx,yy in [(158,79),(181,80),(225,83),(245,82)]:
        box(xx,yy,2,1,'#c4925f')
    for i in range(83):
        x,y=R.randrange(136,267),R.randrange(57,84)
        color=R.choice(['#83786f','#a79b86','#696d69'])
        if i%5==0:dot(x,y,color)
    for a in [174,224]:poly([(a,54),(a+5,54),(a-1,87),(a-6,87)],'#4f606a')
    box(136,86,131,2,'#889590')
    # Angled wall braces.
    for x in [40,110,279,366,428]:
        poly([(x+3,51),(x+12,51),(x+14,99),(x+10,109),(x,106),(x+5,93)],'#293943')
        line([(x+6,53),(x+9,54),(x+10,93),(x+6,102)],'#728084',3)
    tube(54,98,427,98,4)
    # Deck and industrial tilework.
    floor=[(52,105),(428,105),(442,118),(442,203),(424,220),(58,220),(39,201),(39,119)]
    poly(floor,'#3f4c54')
    mask=Image.new('1',im.size,0);ImageDraw.Draw(mask).polygon(floor,fill=1)
    deck=im.copy();dd=ImageDraw.Draw(deck)
    for j in range(8):
        y=102+j*17
        for k in range(14):
            x=22+k*32+(j%2)*16
            c=R.choice(['#424f57','#47555b','#4a565b','#435159','#4c575b','#49565d'])
            dd.rectangle((x,y,x+30,y+15),fill=c);dd.line((x+2,y,x+27,y),fill='#59656a');dd.line((x+1,y+15,x+28,y+15),fill='#323f48')
            dd.point((x+2,y+2),fill='#313d46');dd.point((x+28,y+13),fill='#354149')
            if R.random()<.5:dd.line((x+R.randrange(5,19),y+7,x+21,y+6),fill='#505d62')
    im.paste(deck,(0,0),mask);d=ImageDraw.Draw(im)
    # Floor service trunk, cable, drainage and hazard tape.
    for x in range(63,415,26):grate(x,201,24,6)
    line([(55,190),(90,190),(98,198),(184,198)],'#2c3a44',3)
    line([(55,190),(90,190),(98,198),(184,198)],'#888066')
    for x in [162,301]:stripes(x,121,23,3)
    for x,y in [(150,140),(308,178),(191,172)]:panel(x,y,26,13,'#4c5a60');grate(x+4,y+4,18,5)
    # Foreground cutaway rail, seams and orange edge lights.
    poly([(39,201),(60,218),(424,218),(442,201),(442,212),(426,230),(55,230),(37,211)],'#303f4c')
    line([(39,202),(59,219),(425,219),(442,201)],'#81908e',3)
    for x in range(66,420,32):
        box(x,222,24,5,'#47545d');box(x+2,223,15,1,'#6b7980');box(x+25,220,3,7,'#1c2c39')
        if x%3==0:box(x+3,223,8,2,'#e0ad65' if not on else '#aad89a')
    # Struts and wall lighting.
    for x in [64,315,384]:
        panel(x,53,24,5,'#54626a');box(x+3,54,18,2,'#d0dbc0' if on or x==64 else '#a18c62')
    if n==-1:
        for i in range(7):
            px=70+i*56;door(px-18,96,i<=on);label(px-6,83,'0'+str(i+1),'#b1c4b9')
        crate(54,174);bank(370,171,43)
    else:
        if n==0:bed(57,110);bed(56,151)
        elif n==1:machine(58,108,n);tube(67,148,115,148);machine(59,154,n)
        elif n==2:bank(55,112,64);bank(55,154,64)
        elif n==3:
            machine(55,109,n);console(55,165,65);tube(71,70,96,70)
        elif n==4:console(57,123,63);crate(60,161,39);crate(103,166,23)
        elif n==5:bed(54,109);machine(56,151,n)
        else:bank(55,109,62);bank(55,153,64)
        # Rear medical diagnostics, radio racks, monitors and right airlock.
        panel(56,65,46,26,'#566875');screen(61,70,20,12,True);grate(86,68,11,18)
        bank(303,66,47);bank(355,69,38);panel(400,66,20,26,'#5c6462');grate(404,69,12,17)
        console(229,112,64)
        # Cargo on lower right; heavy vertical airlock at right edge.
        crate(351,175,28);crate(379,181,21);crate(359,164,23)
        door(398,113,on)
        # Cable from terminal to wall, floor direction stencil.
        line([(293,129),(302,129),(309,136),(336,136),(341,131)],'#25333a',2)
        poly([(367,146),(375,146),(375,143),(380,148),(375,152),(375,150),(367,150)],'#92968a')
        if n in [1,4,6]:crate(143,175,22)
    if n>=0 and on:
        # Restored systems have individual, visible output on the serviced machine.
        if n==0:
            for bx,by in [(57,110),(56,151)]:
                box(bx+8,by+29,15,2,'#b5efb9')
        elif n==1:
            for yy in [113,159]:
                for k in range(3):box(94+k*9,yy,4,5,'#b7e9a2')
        elif n==2:
            for yy in [118,160]:
                for k in range(3):box(65,yy+k*8,28,2,'#9fd6a5')
        elif n==3:
            for j in range(24):dot(62+j,118+int(math.sin(j*1.1)*3),'#cdfb9b')
        elif n==4:
            panel(146,130,24,12,'#afbc9f');label(150,131,'OK','#365c49')
        elif n==5:
            screen(67,155,21,12);line([(68,163),(73,163),(76,158),(79,164),(85,161)],'#ccf4b0')
        elif n==6:
            for yy in [114,158]:
                for k in range(3):box(64,yy+k*8,33,2,'#add3ee')
    if n>=0:
        # Sector stencils, pipe elbows, emergency beacons, directional shadows.
        label(161,155,'ARK / 0'+str(n+1),'#727b78')
        box(161,164,24,1,'#606e70');box(188,164,4,1,'#878d7d')
        for x,y in [(49,106),(134,108),(338,105),(427,160)]:
            panel(x,y,6,11,'#52605e')
            box(x+1,y+1,4,4,'#bc814e');box(x+2,y+1,2,2,'#f1ca79')
        # Rolled air lines, dangling diagnostic cable and insulated quick couplings.
        line([(289,55),(288,70),(292,81),(300,83),(306,76),(306,61)],'#152932',3)
        line([(290,55),(289,69),(293,79),(300,81),(304,75),(304,62)],'#92764f')
        line([(351,91),(354,100),(372,102),(379,97)],'#15242d',3)
        box(300,59,9,4,'#6a7d79');box(301,60,7,1,'#b8afa0')
        for x,y in [(210,182),(275,155),(155,130),(303,197)]:
            for j in range(3):line([(x+j*3,y),(x+j*3+3,y-2)],'#616c6c')
        if n==0 or n==5:
            # Curved cyan capsule glazing. Reflections follow the dome.
            for by in ([110,151] if n==0 else [109]):
                bx=57 if by==110 else 56
                line([(bx+8,by+21),(bx+14,by+24),(bx+54,by+24),(bx+62,by+19)],'#78caca',2)
                line([(bx+11,by+23),(bx+27,by+23)],'#caf2d9')
                for k in (26,31,48):
                    line([(bx+k,by+6),(bx+k+6,by+16)],'#96c5c1')
                box(bx+57,by+27,3,2,'#f5b35f')
            # Life support cylinder between cabin and monitor.
            for cx in (144,153):
                cham(cx,92,8,17,3,'#252f35');cham(cx+1,91,6,15,2,'#9c8970')
                box(cx+2,93,2,10,'#cfb98a');box(cx,96,8,2,'#4d5e5c');box(cx+2,89,3,3,'#636a62')
        if n==3:
            for j in range(16):
                xx=63+j;yy=115+int(math.sin(j*.9)*3)
                dot(xx,yy,'#bcf2b6')
        if n==6:
            for cx in (151,179):
                panel(cx,87,21,30,'#536774')
                cham(cx+4,89,13,21,3,'#405b6e')
                poly([(cx+10,91),(cx+14,99),(cx+10,107),(cx+6,99)],'#a4c0ef' if on else '#64849a')
        # Two separate phosphor displays: heartbeat and memory sectors.
        box(236,100,22,8,'#143e37')
        line([(236,105),(242,105),(244,103),(246,106),(249,100),(251,105),(256,105)],'#a4efbb')
        for k in range(4):box(269+k*3,103-(k%3),2,4+(k%3),'#7ed89c')
        # High contrast hatch, latches and readout.
        box(393,124,5,10,'#26363c');box(394,126,3,3,'#c8ed9c' if on else '#eaaa63')
        for x in [67,101,314,348,382]:
            box(x,221,13,2,'#afb8a3')
    # Local pools of coloured light and deep falloff give the deck its night shift.
    shade=Image.new('RGBA',im.size,(0,0,0,0));sd=ImageDraw.Draw(shade)
    if n>=0:
        sd.polygon([(42,106),(129,106),(160,141),(122,145),(42,125)],fill=(8,23,32,48))
        sd.polygon([(228,132),(291,132),(309,147),(246,145)],fill=(6,18,26,75))
        sd.polygon([(350,189),(395,188),(407,199),(363,199)],fill=(6,18,26,80))
    im=Image.alpha_composite(im.convert('RGBA'),shade).convert('RGB')
    illumination=Image.new('RGB',im.size);il=ImageDraw.Draw(illumination)
    def pool(cx,cy,rx,ry,color):
        il.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=color)
    if n>=0:
        pool(262,109,21,8,(9,45,26));pool(79,131,25,10,(2,24,29))
        pool(412,124,15,14,(10,26,12) if on else (36,15,3))
        pool(360,176,14,6,(22,13,4));pool(186,83,45,7,(5,12,23))
    else:
        for k in range(7):pool(70+56*k,108,15,13,(9,27,14) if k<=on else (22,10,3))
    im=ImageChops.add(im,illumination.filter(ImageFilter.GaussianBlur(6)))
    return im
for n in range(-1,7):
    for state in range(8 if n==-1 else 2):
        paint_room(n,state).save(OUT/f'room-{n}-{state}.png')
# Pixel crew member and walking frames. Shadow is drawn in the game.
rows=['.......kkkkkk.......','.....kkbbbbbbkk.....','....kbaaaaaaaabk....','...kbaaaacccaaabk...','...kbaaccccccaabk...','..kbbbdvvvvvvdbbbk..','..kabvhhhiiivvdbak..','..kabviiijjjvvdbak..','...kbdiiijjvvvdbk...','...kbbdvvvvvvdbbk...','....kbbdccccdbbk....','.....kkbaaabbkk.....','....kbbaaddaabbk....','...kabbeeddfeebak...','...kabeedffdeebak...','...kbbkdeeedkbbbk...','...kcckdeeedkccck...','....kkkecccekkk.....','......keekkeek......','......kebkkbek......','......kbbkkbbk......','.....kccckkccck.....','.....kkkkkkkkkk.....']
palette={'k':'#14232d','b':'#986c42','a':'#e3a857','c':'#f3d197','d':'#4c6164','v':'#254853','h':'#c9f6da','i':'#81cebd','j':'#5a9da1','e':'#677879','f':'#b4ed92'}
for step in range(3):
    sprite=Image.new('RGBA',(22,25));pd=ImageDraw.Draw(sprite)
    for y,row in enumerate(rows):
        for x,c in enumerate(row):
            if c in palette:
                off=(1 if x<=10 else -1)*(step-1) if y>=19 else 0
                pd.point((x+1,y+1+off),fill=palette[c])
    sprite.save(OUT/f'crew-{step}.png')
