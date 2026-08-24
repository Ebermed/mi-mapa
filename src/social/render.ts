import { elementMeta, type BranchKey, type ElementKey } from '../engine'

export type SocialFormat='today'|'center'|'animal'|'week'

export type SocialPost = {
  format:SocialFormat
  title:string
  hook:string
  body:string
  cta:string
  palette:ElementKey
  caption:string
  eyebrow?:string
  detail?:string
  years?:string
  animalKey?:BranchKey
  displayHook?:string
}

const SIZE={width:1080,height:1350}
const animalPaths:Record<BranchKey,string>={
  rat:'M6.8 9a2.2 2.2 0 1 0 4.4 0M12.8 9a2.2 2.2 0 1 0 4.4 0M8 10.5c1-2 7-2 8 0 1 2 .5 5-4 7-4.5-2-5-5-4-7zM12 13v1M6 13h3M15 13h3',
  ox:'M8 9C6 8 5 6 5 4c3 0 5 1 6 3M16 9c2-1 3-3 3-5-3 0-5 1-6 3M8 9c1-2 7-2 8 0v6c-1 3-7 3-8 0V9zM10 14h4',
  tiger:'M7 8 5 5l4 1M17 8l2-3-4 1M7 8c1-2 9-2 10 0v7c-2 3-8 3-10 0V8zM9 10h6M10 12h4M12 9v6',
  rabbit:'M9 9C7 6 7 2 9 2c2 0 2 4 2 7M15 9c2-3 2-7 0-7-2 0-2 4-2 7M8 10c1-2 7-2 8 0v5c-1 3-7 3-8 0v-5zM10 13h.1M14 13h.1',
  dragon:'M5 15c2-5 4-7 8-7 3 0 5 2 6 4-2-1-4 0-5 2-6 4-9 1zM10 8 8 5M14 8l2-3M17 11l2-1',
  snake:'M8 6c4-3 8-1 8 2 0 4-8 3-8 7 0 3 5 4 8 1M16 8h.1',
  horse:'M8 18V9l3-5 5 3v8c-1 3-5 4-8 3zM11 8h5M13 10h.1M8 11 5 9',
  goat:'M8 9C6 7 6 4 7 3c2 1 3 3 3 5M16 9c2-2 2-5 1-6-2 1-3 3-3 5M8 9c1-2 7-2 8 0v6c-2 3-6 3-8 0V9zM10 13h4',
  monkey:'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12M5.5 10a2 2 0 1 0 0 4M18.5 10a2 2 0 1 1 0 4M9 11c1-2 5-2 6 0v4c-1 2-5 2-6 0v-4zM10 14h4',
  rooster:'M9 18V8c2-3 6-3 8 0v6c-1 3-5 5-8 4zM11 6c0-2 2-3 3-1 1-2 3-1 3 1M17 9l3 2-3 1M7 10 4 8M7 13 4 14',
  dog:'M8 8 5 5v6M16 8l3-3v6M8 8c1-2 7-2 8 0v7c-1 3-7 3-8 0V8zM10 12h.1M14 12h.1M10 15h4',
  pig:'M7 9C8 6 16 6 17 9v6c-2 3-8 3-10 0V9zM8 8 6 5l4 2M16 8l2-3-4 2M9 13c1-2 5-2 6 0v2c-1 2-5 2-6 0v-2zM11 14h.1M13 14h.1',
}

function roundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function font(size:number,weight=600,serif=false,italic=false){return `${italic?'italic ':''}${weight} ${size}px ${serif?'Georgia, serif':'Arial, sans-serif'}`}
function wrap(ctx:CanvasRenderingContext2D,text:string,maxWidth:number){
  const lines:string[]=[]
  for(const paragraph of text.split('\n')){
    const words=paragraph.trim().split(/\s+/);let line=''
    for(const word of words){const next=line?`${line} ${word}`:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word}else line=next}
    if(line)lines.push(line)
  }
  return lines
}
function textBlock(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number,align:CanvasTextAlign='left'){
  const all=wrap(ctx,text,maxWidth),lines=all.slice(0,maxLines);ctx.textAlign=align
  if(all.length>maxLines)lines[maxLines-1]=`${lines[maxLines-1].replace(/[.,;:]?$/,'')}…`
  lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));return lines.length
}
function fit(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,maxSize:number,minSize:number,weight=800,serif=false){
  let size=maxSize;while(size>minSize){ctx.font=font(size,weight,serif);if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size
}
function paper(ctx:CanvasRenderingContext2D,palette:ElementKey){
  const meta=elementMeta[palette],base=ctx.createLinearGradient(0,0,1080,1350)
  base.addColorStop(0,'#faf5ea');base.addColorStop(.56,'#f1e7d8');base.addColorStop(1,'#e8dccb');ctx.fillStyle=base;ctx.fillRect(0,0,1080,1350)
  const washes:Array<[number,number,number,string]>=[[75,690,360,meta.soft],[1020,170,310,meta.soft]]
  for(const [x,y,r,color] of washes){const wash=ctx.createRadialGradient(x,y,0,x,y,r);wash.addColorStop(0,color);wash.addColorStop(.55,`${color}88`);wash.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=wash;ctx.fillRect(0,0,1080,1350)}
  ctx.save();ctx.strokeStyle='rgba(65,57,48,.12)';ctx.lineWidth=2
  for(let ring=0;ring<10;ring++){ctx.beginPath();for(let x=-60;x<=1140;x+=34){const y=185+ring*112+Math.sin(x/94+ring*.74)*24+Math.cos(x/48+ring)*8;x===-60?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
  ctx.restore();ctx.strokeStyle='rgba(65,57,48,.13)';ctx.lineWidth=2;roundedRect(ctx,34,34,1012,1282,52);ctx.stroke()
}
function route(ctx:CanvasRenderingContext2D,color:string,points:[number,number][],dash=true){
  ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.8;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';if(dash)ctx.setLineDash([14,14]);ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++){const [x,y]=points[i],prev=points[i-1];ctx.bezierCurveTo((prev[0]+x)/2,prev[1],(prev[0]+x)/2,y,x,y)}ctx.stroke();ctx.restore()
}
function pin(ctx:CanvasRenderingContext2D,x:number,y:number,color:string){ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-12,y+10);ctx.lineTo(x,y+34);ctx.lineTo(x+12,y+10);ctx.fill();ctx.fillStyle='#f7f1e7';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.restore()}
function animalIcon(ctx:CanvasRenderingContext2D,key:BranchKey|undefined,x:number,y:number,size:number,color:string){
  if(!key)return;const scale=size/24;ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(scale,scale);ctx.strokeStyle=color;ctx.lineWidth=5/scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(animalPaths[key]));ctx.restore()
}
function brand(ctx:CanvasRenderingContext2D,color:string,series:string){ctx.fillStyle=color;ctx.textAlign='left';ctx.font=font(20,800);ctx.fillText('+  MI MAPA',72,88);ctx.textAlign='right';ctx.font=font(14,800);ctx.fillText(series.toUpperCase(),1008,86)}
function footer(ctx:CanvasRenderingContext2D,color:string){ctx.strokeStyle='rgba(62,54,47,.16)';ctx.beginPath();ctx.moveTo(72,1236);ctx.lineTo(1008,1236);ctx.stroke();ctx.fillStyle=color;ctx.textAlign='left';ctx.font=font(18,800);ctx.fillText('TU CARTA COMPLETA ES GRATIS',72,1275);ctx.textAlign='right';ctx.font=font(15,600);ctx.fillText('ebermed.github.io/mi-mapa  ↗',1008,1275)}

function drawToday(ctx:CanvasRenderingContext2D,post:SocialPost){
  const meta=elementMeta[post.palette];paper(ctx,post.palette);brand(ctx,meta.dark,post.eyebrow||'HOY')
  ctx.fillStyle=meta.color;ctx.textAlign='left';ctx.font=font(220,800);ctx.fillText('HOY',62,302)
  route(ctx,meta.color,[[118,650],[300,730],[510,590],[760,720],[1010,610]])
  pin(ctx,150,633,meta.dark);animalIcon(ctx,post.animalKey,610,665,500,meta.color)
  ctx.fillStyle='#313743';ctx.font=font(47,560,true);textBlock(ctx,post.displayHook||post.hook,72,1120,900,58,2)
  footer(ctx,meta.dark)
}

function drawCenter(ctx:CanvasRenderingContext2D,post:SocialPost){
  const meta=elementMeta[post.palette],name=post.title.replace(/^TU CENTRO:\s*/,'')
  paper(ctx,post.palette);brand(ctx,meta.dark,'LOS 10 CENTROS')
  route(ctx,meta.color,[[70,530],[310,450],[560,575],[820,380],[1020,470]])
  ctx.fillStyle=meta.dark;ctx.font=font(28,800);ctx.textAlign='left';ctx.fillText('TU CENTRO:',72,202)
  ctx.font=font(fit(ctx,name,680,112,68,800,true),800,true);ctx.fillText(name,72,328)
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=meta.color;ctx.beginPath();ctx.arc(875,278,126,0,Math.PI*2);ctx.fill();ctx.restore();ctx.strokeStyle=meta.dark;ctx.lineWidth=3;ctx.beginPath();ctx.arc(875,278,94,0,Math.PI*2);ctx.stroke();ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font=font(46,700,true);ctx.fillText(post.detail||'十',875,295)
  ctx.textAlign='left';ctx.fillStyle='#37342f';ctx.font=font(68,700,true);textBlock(ctx,post.hook,72,700,900,78,3)
  ctx.fillStyle='rgba(255,253,248,.72)';roundedRect(ctx,72,955,780,150,28);ctx.fill();ctx.fillStyle=meta.dark;ctx.font=font(27,540,true);textBlock(ctx,post.body,104,1010,712,38,3)
  footer(ctx,meta.dark)
}

function drawAnimal(ctx:CanvasRenderingContext2D,post:SocialPost){
  const meta=elementMeta[post.palette],name=post.title.replace(/^SI ERES\s*/,'')
  paper(ctx,post.palette);brand(ctx,meta.dark,`SI ERES ${name}`)
  ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=font(112,900);ctx.fillText('¿TE PASA',64,238);ctx.fillText('ESTO?',64,350)
  route(ctx,meta.color,[[70,620],[270,520],[480,700],[740,540],[1010,660]]);pin(ctx,900,568,meta.dark);animalIcon(ctx,post.animalKey,300,625,310,meta.color)
  ctx.fillStyle='#34322e';ctx.font=font(58,700,true);textBlock(ctx,post.hook,470,550,500,68,4)
  ctx.fillStyle=meta.dark;ctx.font=font(18,800);ctx.fillText(name,72,905);ctx.fillStyle='#34322e';ctx.font=font(28,520,true);textBlock(ctx,post.body,72,958,860,38,3)
  if(post.years){ctx.fillStyle=meta.dark;ctx.font=font(15,800);ctx.fillText('AÑOS FRECUENTES',72,1110);ctx.fillStyle='#34322e';ctx.font=font(18,600);textBlock(ctx,post.years,72,1143,900,28,2)}
  footer(ctx,meta.dark)
}

function drawWeek(ctx:CanvasRenderingContext2D,post:SocialPost){
  const meta=elementMeta[post.palette],name=post.title.replace(/^SEMANA PARA\s*/,'')
  paper(ctx,post.palette);brand(ctx,meta.dark,`SEMANA PARA ${name}`)
  ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=font(138,900);ctx.fillText('ESTA',64,240);ctx.fillText('SEMANA',64,374)
  const stations:[[number,number],[number,number],[number,number],[number,number]]=[[105,650],[370,560],[675,705],[970,565]]
  route(ctx,meta.color,stations,false)
  stations.forEach(([x,y],index)=>{ctx.fillStyle=index===1?meta.dark:'#f7f1e7';ctx.strokeStyle=meta.dark;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,index===1?34:22,0,Math.PI*2);ctx.fill();ctx.stroke()})
  animalIcon(ctx,post.animalKey,370,560,120,'#f7f1e7')
  ctx.fillStyle=meta.dark;ctx.font=font(17,800);ctx.fillText(name,72,835)
  ctx.fillStyle='#34322e';ctx.font=font(58,700,true);textBlock(ctx,post.hook,72,910,900,68,4)
  if(post.years){ctx.fillStyle=meta.dark;ctx.font=font(16,700);textBlock(ctx,`Años: ${post.years}`,72,1150,900,25,2)}
  footer(ctx,meta.dark)
}

export function drawSocialPost(canvas:HTMLCanvasElement,post:SocialPost){
  canvas.width=SIZE.width;canvas.height=SIZE.height;const ctx=canvas.getContext('2d')!
  if(post.format==='today')drawToday(ctx,post)
  else if(post.format==='center')drawCenter(ctx,post)
  else if(post.format==='animal')drawAnimal(ctx,post)
  else drawWeek(ctx,post)
}

export function downloadSocialPost(post:SocialPost,filename:string){
  const canvas=document.createElement('canvas');drawSocialPost(canvas,post)
  canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1200)},'image/png')
}
