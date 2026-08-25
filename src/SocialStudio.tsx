import { useEffect, useMemo, useRef, useState } from 'react'
import { branchOrder, branches, stemOrder, stems } from './engine'
import { buildAnimalPost, buildCenterPost, buildWeeklyAnimalCarousel } from './social/library'
import { buildHoyPost } from './social/hoy'
import { downloadSocialPost, drawSocialPost, type SocialPost } from './social/render'
import { todayInZone } from './timeEngine'

type StudioFormat='today'|'center'|'animal'|'week'
const formatLabels:Record<StudioFormat,string>={today:'Hoy',center:'Centro',animal:'Animal',week:'Semana'}

function randomIndex(length:number){return Math.floor(Math.random()*length)}

function centerPost(index:number):SocialPost{
  const stem=stemOrder[index%stemOrder.length],post=buildCenterPost(stem)
  return {...post,format:'center',eyebrow:'LOS 10 CENTROS',detail:stems[stem].han}
}

function animalPost(index:number):SocialPost{
  const branch=branchOrder[index%branchOrder.length],post=buildAnimalPost(branch)
  return {...post,format:'animal',eyebrow:'LOS 12 ANIMALES',detail:branches[branch].han,animalKey:branch}
}

function weeklyPosts(date:string):SocialPost[]{
  return buildWeeklyAnimalCarousel(date).map((post,index)=>({
    format:'week',title:post.title,hook:post.focus,body:'',years:post.years,cta:post.cta,palette:post.palette,
    eyebrow:'ESTA SEMANA',detail:branches[branchOrder[index]].han,animalKey:post.animalKey,
    caption:`${post.title}\n\n${post.focus}\n\nAños: ${post.years}.\n\n${post.cta}`,
  }))
}

export default function SocialStudio(){
  const [format,setFormat]=useState<StudioFormat>('today'),[seed,setSeed]=useState(0),[copied,setCopied]=useState(false)
  const canvasRef=useRef<HTMLCanvasElement>(null),date=todayInZone('America/Mexico_City')
  const selection=useMemo(()=>{
    if(format==='today'){
      const post=buildHoyPost(date)
      return {post:{...post,format:'today',body:post.explanation,detail:post.animal,animalKey:post.animalKey} as SocialPost,index:0,total:1}
    }
    if(format==='center'){const index=randomIndex(stemOrder.length);return{post:centerPost(index),index,total:stemOrder.length}}
    if(format==='animal'){const index=randomIndex(branchOrder.length);return{post:animalPost(index),index,total:branchOrder.length}}
    const posts=weeklyPosts(date),index=randomIndex(posts.length);return{post:posts[index],index,total:posts.length}
  },[format,seed,date])
  useEffect(()=>{if(canvasRef.current)drawSocialPost(canvasRef.current,selection.post)},[selection])
  const changeFormat=(next:StudioFormat)=>{setFormat(next);setSeed(value=>value+1);setCopied(false)}
  const copyCaption=async()=>{await navigator.clipboard.writeText(selection.post.caption);setCopied(true);setTimeout(()=>setCopied(false),1800)}
  const filename=`mi-mapa-${format}-${date}-${selection.index+1}.png`
  return <main className="shell studioPage">
    <header className="topbar"><div className="brand"><span>十</span><b>MI MAPA</b></div><span className="stepLabel">ESTUDIO</span></header>
    <section className="studioIntro"><p className="eyebrow">PUBLICACIONES GENERALES</p><h1>Estudio<br/><em>MI MAPA.</em></h1><p>Elige una serie, genera una variante y descarga la pieza lista para publicar.</p></section>
    <nav className="studioTabs" aria-label="Tipo de publicación">{(Object.keys(formatLabels) as StudioFormat[]).map(key=><button key={key} className={format===key?'active':''} onClick={()=>changeFormat(key)}>{formatLabels[key]}</button>)}</nav>
    <section className="studioWorkspace">
      <div className="studioCanvasWrap"><canvas ref={canvasRef} aria-label={`Vista previa: ${selection.post.title}`}/><span>{selection.index+1} / {selection.total}</span></div>
      <aside className="studioControls">
        <p className="eyebrow">TEXTO DE LA PUBLICACIÓN</p><h2>{selection.post.title}</h2>
        <textarea readOnly value={selection.post.caption}/>
        <button className="primary" onClick={()=>setSeed(value=>value+1)}>Generar otra <span>↻</span></button>
        <button className="secondary" onClick={()=>downloadSocialPost(selection.post,filename)}>Descargar PNG <span>↓</span></button>
        <button className="textButton" onClick={copyCaption}>{copied?'Texto copiado ✓':'Copiar caption'}</button>
      </aside>
    </section>
    <p className="studioNote">El Estudio se abre únicamente desde su dirección directa.</p>
  </main>
}
