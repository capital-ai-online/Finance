#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from capital_ai_media import (
    MediaRenderError, enforce_ffmpeg_license_profile, inspect_ffmpeg,
    load_brand_palette, sha256_file,
)

W, H = 1280, 720
OUT_W, OUT_H = 1920, 1080
GOLD = '#F5C453'; GOLD_LIGHT='#FFF2B2'; GOLD_DARK='#D4A017'; GOLD_MUTED='#8A640F'
CYAN='#0DDDDD'; PURPLE='#B026FF'; WHITE='#FFFFFF'; BG='#050506'; MUTED='#8f9299'; DANGER='#f87171'; WARNING='#fbbf24'

def apply_brand_palette(palette):
    global GOLD, GOLD_LIGHT, GOLD_DARK, GOLD_MUTED, CYAN, PURPLE, WHITE, WARNING
    GOLD = palette.gold
    GOLD_LIGHT = palette.gold_light
    GOLD_DARK = palette.gold_dark
    GOLD_MUTED = palette.gold_muted
    CYAN = palette.cyan
    PURPLE = palette.purple
    WHITE = palette.foreground
    WARNING = palette.gold_dark
NETWORK = [
    (0.50,0.51),(0.18,0.16),(0.54,0.18),(0.84,0.14),(0.20,0.43),(0.35,0.48),(0.86,0.45),(0.16,0.82),(0.50,0.88),(0.84,0.79),
    (0.33,0.25),(0.70,0.27),(0.68,0.66),(0.33,0.70),(0.51,0.34),(0.50,0.72)
]
EDGES=[(1,10),(10,5),(5,7),(7,13),(13,8),(8,15),(15,9),(9,12),(12,6),(6,3),(3,11),(11,2),(2,14),(14,0),(0,5),(0,6),(0,8),(0,2),(10,14),(14,11),(5,13),(13,15),(15,12)]


def parse_args():
    p=argparse.ArgumentParser()
    p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--allow-gpl-ffmpeg',action='store_true')
    p.add_argument('--preview-frame',type=Path)
    return p.parse_args()


def font(size,bold=False):
    names=(
        'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf',
        'LiberationSans-Bold.ttf' if bold else 'LiberationSans-Regular.ttf',
    )
    for name in names:
        try:
            return ImageFont.truetype(name,size)
        except OSError:
            continue
    return ImageFont.load_default()


def ease(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)

def fade_window(t,start,end,edge=.55):
    if t<start or t>end: return 0
    return min(1,(t-start)/edge,(end-t)/edge) if end-start>2*edge else math.sin(math.pi*(t-start)/(end-start))

def hex_rgba(h,a):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))+(int(max(0,min(1,a))*255),)

def add_glow(base, centers):
    glow=Image.new('RGBA',base.size,(0,0,0,0)); d=ImageDraw.Draw(glow)
    for x,y,r,c,a in centers:
        d.ellipse((x-r,y-r,x+r,y+r),fill=hex_rgba(c,a))
    glow=glow.filter(ImageFilter.GaussianBlur(60))
    return Image.alpha_composite(base.convert('RGBA'),glow)

def draw_text(draw,xy,text,size,color=WHITE,bold=False,anchor=None,alpha=1.0):
    draw.text(xy,text,font=font(size,bold),fill=hex_rgba(color,alpha),anchor=anchor)

def metallic_node(draw,x,y,r=7,alpha=1.0):
    draw.ellipse((x-r,y-r,x+r,y+r),fill=hex_rgba(GOLD_DARK,alpha))
    draw.ellipse((x-r+2,y-r+2,x+r-2,y+r-2),fill=hex_rgba(GOLD,alpha))
    draw.ellipse((x-r/2,y-r/2,x,y),fill=hex_rgba(GOLD_LIGHT,alpha*.85))

def network(draw,cx,cy,scale,progress=1.0,path_phase=0.0,alpha=1.0):
    pts=[(cx+(x-.5)*scale, cy+(y-.5)*scale*.78) for x,y in NETWORK]
    n_visible=max(1,math.ceil(progress*len(pts)))
    edge_visible=max(0,math.ceil(progress*len(EDGES)))
    for ei,(a,b) in enumerate(EDGES[:edge_visible]):
        col=GOLD_MUTED
        if ((ei/len(EDGES)+path_phase)%1)<.13: col=CYAN
        if ((ei/len(EDGES)+path_phase+.37)%1)<.10: col=PURPLE
        draw.line((*pts[a],*pts[b]),fill=hex_rgba(col,alpha*.76),width=max(1,int(scale/270)))
    for i,(x,y) in enumerate(pts[:n_visible]):
        metallic_node(draw,x,y,max(3,int(scale/105)),alpha)
    return pts

def headline(draw,text,alpha=1):
    draw_text(draw,(78,86),text,48,GOLD,bold=True,alpha=alpha)
    draw.line((78,151,1202,151),fill=hex_rgba(GOLD,alpha*.7),width=2)

def disclaimer(draw,text,alpha=.72):
    draw_text(draw,(78,676),text,15,MUTED,alpha=alpha)

def frame_base(t):
    im=Image.new('RGBA',(W,H),BG)
    return add_glow(im,[(160,90,210,PURPLE,.055),(1090,625,260,CYAN,.045),(650,80,220,GOLD,.035)])

def draw_origin(im,d,t,manifest):
    p=ease(t/5)
    # slow camera feeling through scale expansion
    scale=220+470*p
    if t<1.6:
        metallic_node(d,W/2,H/2,7+4*ease(t/1.6),ease(t/.8))
    elif t<2.6:
        p2=ease((t-1.6)/1.0); x2=W/2+120*p2
        metallic_node(d,W/2,H/2,10)
        d.line((W/2,H/2,x2,H/2-42*p2),fill=hex_rgba(GOLD,.8),width=2)
        metallic_node(d,x2,H/2-42*p2,8,p2)
    else:
        network(d,W/2,H/2,scale,progress=ease((t-2.55)/2.0),path_phase=t*.05,alpha=min(1,(t-2.4)))
    if t>3.4: disclaimer(d,manifest['disclaimer'],fade_window(t,3.4,5,.5))

def draw_data(im,d,t):
    local=t-5; a=fade_window(t,5,10,.45); headline(d,'DATA',a)
    # sparse market observations and curves
    for row in range(5):
        yy=235+row*72
        pts=[]
        for i in range(24):
            x=92+i*46
            y=yy+math.sin(i*.62+local*.65+row)*18+math.sin(i*.21+row)*10
            pts.append((x,y))
        d.line(pts,fill=hex_rgba(GOLD_MUTED,.45*a),width=2)
        for i,(x,y) in enumerate(pts):
            if (i+row)%4==0: metallic_node(d,x,y,3,.75*a)
    # intelligence lanes activate subtly
    for k,c in enumerate((CYAN,PURPLE)):
        y=590+k*24
        x2=90+int(1020*ease(local/5))
        d.line((90,y,x2,y),fill=hex_rgba(c,.45*a),width=2)

def draw_evidence(im,d,t):
    local=t-10; a=fade_window(t,10,15,.45); headline(d,'EVIDENCE',a)
    labels=['PRICE HISTORY','CASH FLOWS','BALANCE SHEET','EARNINGS','YIELD CURVE']
    for i,label in enumerate(labels):
        y=225+i*74
        strength=ease((local-i*.32)/1.8)
        d.rounded_rectangle((96,y,1030,y+44),radius=10,outline=hex_rgba(GOLD_MUTED,.35*a),width=1)
        d.rectangle((98,y+2,98+int(760*strength),y+42),fill=hex_rgba(GOLD,.09*a))
        draw_text(d,(116,y+12),label,18,GOLD_LIGHT,alpha=.8*a)
        # evidence verified point
        if strength>.65: metallic_node(d,1080,y+22,5,a)
    draw_text(d,(96,624),'RAW OBSERVATIONS  →  VERIFIED SIGNALS',20,MUTED,bold=True,alpha=.75*a)

def draw_models(im,d,t,checks):
    local=t-15; a=fade_window(t,15,23,.5); headline(d,'MODELS',a)
    cx,cy=640,420
    # core
    for r,alp in [(84,.08),(62,.12),(42,.2)]: d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=hex_rgba(GOLD,alp*a),width=2)
    metallic_node(d,cx,cy,15,a)
    draw_text(d,(cx,cy+40),'VALUE',19,GOLD_LIGHT,bold=True,anchor='ma',alpha=.9*a)
    items=checks[:9]
    for i,label in enumerate(items):
        ang=math.radians(-90)+i*2*math.pi/len(items)
        rr=215
        x=cx+math.cos(ang)*rr; y=cy+math.sin(ang)*rr
        active=ease((local-i*.45)/1.2)
        col=GOLD if i!=6 else WARNING
        d.line((cx+math.cos(ang)*66,cy+math.sin(ang)*66,x-math.cos(ang)*20,y-math.sin(ang)*20),fill=hex_rgba(col,.35*active*a),width=2)
        metallic_node(d,x,y,6,active*a)
        anchor='lm' if x>cx+10 else ('rm' if x<cx-10 else 'mm')
        tx=x+18 if x>cx+10 else (x-18 if x<cx-10 else x)
        draw_text(d,(tx,y),label,12,GOLD_LIGHT,bold=True,anchor=anchor,alpha=.84*active*a)
    draw_text(d,(640,665),'INDEPENDENT CHECKS • NO SINGLE SIGNAL',15,MUTED,bold=True,anchor='mm',alpha=.78*a)

def draw_risk(im,d,t):
    local=t-23; a=fade_window(t,23,29,.45); headline(d,'RISK',a)
    # risk field grid
    for gx in range(100,1181,90): d.line((gx,210,gx,610),fill=hex_rgba('#ffffff',.025*a),width=1)
    for gy in range(210,611,70): d.line((100,gy,1180,gy),fill=hex_rgba('#ffffff',.025*a),width=1)
    pts=[]
    for i in range(180):
        x=100+i*6
        stress=ease(local/6)
        y=405+math.sin(i*.11+local*.9)*30*(1+stress*1.8)+math.sin(i*.035)*45*stress
        pts.append((x,y))
    d.line(pts,fill=hex_rgba(GOLD,.75*a),width=3)
    # correlation tightening paths
    for j,c in enumerate((CYAN,PURPLE)):
        yy=300+j*180
        end=200+int(820*ease(local/6))
        d.arc((200,yy-90,end,yy+90),0,180,fill=hex_rgba(c,.34*a),width=2)
    labels=['VOLATILITY','CORRELATION','LIQUIDITY','VALUATION STRESS']
    for i,l in enumerate(labels): draw_text(d,(102+i*272,632),l,14,MUTED,bold=True,alpha=.75*a)

def draw_intelligence(im,d,t):
    local=t-29; a=fade_window(t,29,35,.45); headline(d,'INTELLIGENCE',a)
    assets=[('EQUITY',220,275),('INDEX',420,225),('FX',640,245),('CRYPTO',860,225),('COMMODITIES',1060,285),('BONDS',970,515)]
    pcx,pcy=640,470
    for i,(label,x,y) in enumerate(assets):
        active=ease((local-i*.25)/1.6)
        d.line((x,y,pcx,pcy),fill=hex_rgba(CYAN if i%2==0 else PURPLE,.25*active*a),width=2)
        metallic_node(d,x,y,8,active*a)
        draw_text(d,(x,y+22),label,14,GOLD_LIGHT,bold=True,anchor='ma',alpha=.8*active*a)
    # portfolio intelligence rings
    p=ease((local-1.5)/3.5)
    for r,c in [(105,GOLD),(140,CYAN),(176,PURPLE)]:
        d.arc((pcx-r,pcy-r,pcx+r,pcy+r),-90,-90+330*p,fill=hex_rgba(c,.35*a),width=3)
    metallic_node(d,pcx,pcy,13,p*a)
    draw_text(d,(pcx,pcy+36),'PORTFOLIO',17,GOLD_LIGHT,bold=True,anchor='ma',alpha=.85*p*a)

def draw_traceability(im,d,t):
    local=t-35; a=fade_window(t,35,40,.45)
    labels=['SOURCE','METRIC','CHECK','MODEL','SCORE']
    xs=[160,400,640,880,1120]
    for i,(x,label) in enumerate(zip(xs,labels)):
        active=ease((local-i*.42)/1.1)
        if i>0:
            d.line((xs[i-1]+45,360,x-45,360),fill=hex_rgba(CYAN if i%2 else PURPLE,.45*active*a),width=2)
        metallic_node(d,x,360,9,active*a)
        draw_text(d,(x,405),label,20,GOLD_LIGHT,bold=True,anchor='ma',alpha=.9*active*a)
    draw_text(d,(640,155),'ANALYTICAL LINEAGE',31,GOLD,bold=True,anchor='ma',alpha=.9*a)
    draw_text(d,(640,520),'Every conclusion remains connected to its evidence.',20,MUTED,anchor='ma',alpha=.75*a)

def draw_final(im,d,t,manifest):
    local=t-40; a=fade_window(t,40,45,.55)
    # emblem on left, restrained activation
    network(d,310,340,390,progress=ease(local/2.5),path_phase=local*.08,alpha=a)
    x=590
    draw_text(d,(x,290),'CAPITAL-AI',52,GOLD,bold=True,alpha=a)
    draw_text(d,(x,370),'QUANTITATIVE INTELLIGENCE',27,WHITE,bold=True,alpha=a)
    draw_text(d,(x,411),'FOR COMPLEX MARKETS',27,WHITE,bold=True,alpha=a)
    d.line((x,455,1140,455),fill=hex_rgba(GOLD,.45*a),width=2)
    disclaimer(d,manifest['disclaimer'],.72*a)

def make_frame(t,manifest):
    im=frame_base(t); d=ImageDraw.Draw(im,'RGBA')
    if t<5: draw_origin(im,d,t,manifest)
    elif t<10: draw_data(im,d,t)
    elif t<15: draw_evidence(im,d,t)
    elif t<23: draw_models(im,d,t,manifest['valueChecks'])
    elif t<29: draw_risk(im,d,t)
    elif t<35: draw_intelligence(im,d,t)
    elif t<40: draw_traceability(im,d,t)
    else: draw_final(im,d,t,manifest)
    # cinematic fade from absolute black at beginning/end
    fade=1
    if t<.8: fade=ease(t/.8)
    if t>44.2: fade=ease((45-t)/.8)
    if fade<1:
        black=Image.new('RGBA',(W,H),(0,0,0,255)); im=Image.blend(black,im,fade)
    return im.convert('RGB')

def main():
    args=parse_args()
    if not args.manifest.is_file():
        raise MediaRenderError(f'manifest not found: {args.manifest}')
    m=json.loads(args.manifest.read_text(encoding='utf-8'))
    if m.get('schemaVersion')!='1.0.0' or m.get('durationSeconds')!=45:
        raise MediaRenderError('cinematic manifest must be schemaVersion 1.0.0 and exactly 45 seconds')
    if any(key in m for key in ('mediaUrl','imageUrl','sourceUrl')):
        raise MediaRenderError('remote media URLs are not accepted by the cinematic renderer')
    expected_headlines=['DATA','EVIDENCE','MODELS','RISK','INTELLIGENCE']
    if m.get('headlineSequence') != expected_headlines:
        raise MediaRenderError('headlineSequence must be DATA, EVIDENCE, MODELS, RISK, INTELLIGENCE')
    if m.get('finalStatement') != 'QUANTITATIVE INTELLIGENCE FOR COMPLEX MARKETS':
        raise MediaRenderError('finalStatement must match the approved CAPITAL-AI brand statement')
    scenes=m.get('scenes')
    if not isinstance(scenes,list) or len(scenes)!=8:
        raise MediaRenderError('cinematic manifest must contain exactly eight bounded scenes')
    cursor=0.0
    for index,scene in enumerate(scenes,start=1):
        if not isinstance(scene,dict):
            raise MediaRenderError(f'scene {index} must be an object')
        start=float(scene.get('start',-1)); end=float(scene.get('end',-1))
        if abs(start-cursor)>1e-9 or end<=start or end>45:
            raise MediaRenderError(f'scene {index} timeline is not contiguous/bounded')
        cursor=end
    if abs(cursor-45)>1e-9:
        raise MediaRenderError('cinematic scene timeline must end at 45 seconds')
    checks=m.get('valueChecks')
    if not isinstance(checks,list) or len(checks)!=9 or any(not isinstance(item,str) or not item.strip() for item in checks):
        raise MediaRenderError('valueChecks must contain exactly nine non-empty labels')
    palette=load_brand_palette(); apply_brand_palette(palette)
    ffmpeg_info=inspect_ffmpeg('ffmpeg')
    enforce_ffmpeg_license_profile(ffmpeg_info, allow_gpl_ffmpeg=args.allow_gpl_ffmpeg)
    ff=ffmpeg_info.executable; fp=shutil.which('ffprobe')
    if not fp: raise MediaRenderError('ffprobe executable not found')
    gpl=ffmpeg_info.enable_gpl; nonfree=ffmpeg_info.enable_nonfree; buildsha=ffmpeg_info.buildconf_sha256
    fps=int(m.get('fps',24)); render_fps=int(m.get('renderFps',fps)); duration=float(m['durationSeconds']); total=int(round(render_fps*duration))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    cmd=[ff,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(render_fps),'-i','-','-an','-vf',f'framerate=fps={fps}:interp_start=0:interp_end=255:scene=100,scale={OUT_W}:{OUT_H}:flags=lanczos,format=yuv420p','-c:v','mpeg4','-q:v','3','-movflags','+faststart',str(args.output)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    assert proc.stdin is not None
    preview_saved=False
    for idx in range(total):
        t=idx/render_fps
        fr=make_frame(t,m)
        if args.preview_frame and not preview_saved and t>=18.7:
            fr.resize((OUT_W,OUT_H),Image.Resampling.LANCZOS).save(args.preview_frame)
            preview_saved=True
        proc.stdin.write(fr.tobytes())
        if idx % (render_fps*5)==0:
            print(f'rendered {idx/render_fps:.0f}s/{duration:.0f}s',flush=True)
    proc.stdin.close(); rc=proc.wait()
    if rc: raise SystemExit(rc)
    probe=subprocess.run([fp,'-v','error','-show_entries','stream=width,height:format=duration','-of','json',str(args.output)],capture_output=True,text=True,check=True)
    info=json.loads(probe.stdout); stream=info['streams'][0]; dur=float(info['format']['duration'])
    if (stream['width'],stream['height'])!=(OUT_W,OUT_H) or abs(dur-duration)>.2: raise SystemExit(f'invalid output {stream} duration={dur}')
    sha=sha256_file(args.output)
    asset_manifest=args.output.with_suffix('.asset-manifest.json')
    asset_manifest.write_text(json.dumps({
        'schemaVersion':'1.0.0','brand':'CAPITAL-AI','publishReady':False,
        'source':{'type':'cinematic-brand-film-manifest','path':args.manifest.name},
        'asset':{'path':args.output.name,'mimeType':'video/mp4','width':OUT_W,'height':OUT_H,'fps':fps,'durationSeconds':dur,'sha256':sha},
        'renderer':{'image':'Pillow','video':'FFmpeg','videoCodec':'mpeg4','networkAccess':False,'ffmpegEnableGpl':gpl,'ffmpegEnableNonfree':nonfree,'ffmpegBuildconfSha256':buildsha,'developerSmokeOnly':bool(gpl)},
        'publishingBoundary':'Requires existing SocialMediaEngine asset validation + hash-bound human approval before publish.'
    },indent=2)+'\n')
    print(json.dumps({'ok':True,'output':str(args.output),'sha256':sha,'duration':dur,'developerSmokeOnly':bool(gpl)},indent=2))

if __name__=='__main__':
    try:
        main()
    except MediaRenderError as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}), file=sys.stderr)
        raise SystemExit(2)
