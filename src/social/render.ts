import { elementMeta, type ElementKey } from '../engine'

export type SocialPost = {
  title:string
  hook:string
  body:string
  cta:string
  palette:ElementKey
  caption:string
  eyebrow?:string
  detail?:string
}

const SIZE={width:1080,height:1350}

function roundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r)
}

function wrap(ctx:CanvasRenderingContext2D,text:string,maxWidth:number){
  const lines:string[]=[],paragraphs=text.split('\n')
  for(const paragraph of paragraphs){
    const words=paragraph.trim().split(/\s+/);let line=''
    for(const word of words){
      const next=line?`${line} ${word}`:word
      if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word}else line=next
    }
    if(line)lines.push(line)
  }
  return lines
}

function textBlock(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number){
  const lines=wrap(ctx,text,maxWidth).slice(0,maxLines)
  if(wrap(ctx,text,maxWidth).length>maxLines)lines[maxLines-1]=`${lines[maxLines-1].replace(/[.,;:]?$/,'')}…`
  lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight))
}

export function drawSocialPost(canvas:HTMLCanvasElement,post:SocialPost){
  canvas.width=SIZE.width;canvas.height=SIZE.height
  const ctx=canvas.getContext('2d')!,meta=elementMeta[post.palette]
  const paper=ctx.createLinearGradient(0,0,SIZE.width,SIZE.height)
  paper.addColorStop(0,'#f7f1e7');paper.addColorStop(.58,'#efe5d6');paper.addColorStop(1,'#e8dccb')
  ctx.fillStyle=paper;ctx.fillRect(0,0,SIZE.width,SIZE.height)
  ctx.save();ctx.strokeStyle='rgba(77,64,49,.14)';ctx.lineWidth=2
  for(let ring=0;ring<8;ring++){
    ctx.beginPath()
    for(let x=-80;x<=1160;x+=34){const y=215+ring*125+Math.sin(x/88+ring*.72)*25+Math.cos(x/43+ring)*8;x===-80?ctx.moveTo(x,y):ctx.lineTo(x,y)}
    ctx.stroke()
  }
  ctx.strokeStyle=meta.color;ctx.globalAlpha=.58;ctx.lineWidth=6;ctx.setLineDash([18,16]);ctx.beginPath();ctx.moveTo(122,1110);ctx.bezierCurveTo(255,950,220,850,410,740);ctx.bezierCurveTo(620,620,610,430,930,286);ctx.stroke();ctx.restore()
  ctx.fillStyle='rgba(255,253,247,.86)';roundedRect(ctx,48,48,984,1254,58);ctx.fill();ctx.strokeStyle='rgba(77,64,49,.16)';ctx.lineWidth=2;ctx.stroke()
  ctx.fillStyle=meta.dark;ctx.font='800 24px Arial, sans-serif';ctx.textAlign='left';ctx.fillText('十  MI MAPA',88,108)
  ctx.textAlign='right';ctx.font='700 16px Arial, sans-serif';ctx.fillText((post.eyebrow||'UNA FORMA SIMPLE DE ENTENDERTE').toUpperCase(),992,106)
  ctx.textAlign='left';ctx.fillStyle=meta.dark;ctx.font='800 18px Arial, sans-serif';ctx.fillText(post.title.toUpperCase(),88,202)
  ctx.fillStyle=meta.soft;ctx.beginPath();ctx.arc(844,360,154,0,Math.PI*2);ctx.fill();ctx.strokeStyle=meta.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(844,360,124,0,Math.PI*2);ctx.stroke()
  ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font='700 42px Georgia, serif';ctx.fillText(post.detail||'十',844,377)
  ctx.textAlign='left';ctx.fillStyle='#3e3832';ctx.font='700 62px Georgia, serif';textBlock(ctx,post.hook,88,360,650,70,5)
  ctx.fillStyle='rgba(255,253,247,.76)';roundedRect(ctx,88,820,840,238,32);ctx.fill();ctx.strokeStyle='rgba(77,64,49,.12)';ctx.stroke()
  ctx.fillStyle=meta.dark;ctx.font='800 15px Arial, sans-serif';ctx.fillText('ASÍ SE NOTA',128,875)
  ctx.fillStyle='#3e3832';ctx.font='500 29px Georgia, serif';textBlock(ctx,post.body,128,930,744,38,4)
  ctx.fillStyle=meta.dark;ctx.font='800 18px Arial, sans-serif';ctx.fillText('TU CARTA COMPLETA ES GRATIS',88,1205)
  ctx.fillStyle='#3e3832';ctx.font='500 16px Arial, sans-serif';ctx.fillText('ebermed.github.io/mi-mapa',88,1243)
  ctx.textAlign='right';ctx.font='700 24px Arial, sans-serif';ctx.fillText('↗',992,1235)
}

export function downloadSocialPost(post:SocialPost,filename:string){
  const canvas=document.createElement('canvas');drawSocialPost(canvas,post)
  canvas.toBlob(blob=>{
    if(!blob)return
    const url=URL.createObjectURL(blob),link=document.createElement('a')
    link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1200)
  },'image/png')
}
