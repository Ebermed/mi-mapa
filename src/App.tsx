import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import {
  branches, calculateChart, elementMeta, fixtures, identityMeta, interactionReading,
  lowestElement, pillarLabel, pillarMeta, pillarReading, profileSummary, strongestElement,
  stems, voidReading,
  type BirthInput, type Chart, type ElementKey, type PillarKey, type StemKey, type TenGodKey,
} from './engine'

type View = 'home'|'form'|'stories'|'reading'
type SavedMap = { id:string; label:string; input:BirthInput; createdAt:number; completed:boolean }
type ShareKind = 'profiles'|'elements'|'actions'|'summary'

const STORE='mi-mapa.library.v1'
const PILLAR_ORDER:PillarKey[]=['hour','day','month','year']
const ELEMENT_ORDER:ElementKey[]=['wood','fire','earth','metal','water']
const iconPaths:Record<StemKey,string>={
  jia:'M11 20c0-6 2-11 5-16 2 4 4 9 4 16M16 10c-3 0-5-1-7-3M15 14c-3 0-5 1-7 3',
  yi:'M5 18c5-8 9-10 15-12-2 7-6 12-13 14-1-1-2-1-2-2z',
  bing:'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  ding:'M13 21c-4 0-7-3-6-7 0-3 2-5 5-8 0 3 2 4 3 6 1-3 1-6 0-9 4 3 6 7 6 11 0 4-3 7-8 7z',
  wu:'M3 19 11 6l3 5 2-3 5 11H3z',
  ji:'M5 19h14M7 19v-6m5 6V9m5 10v-8M7 10c2-3 4-4 5-7 1 3 3 4 5 7',
  geng:'M12 3l8 7-3 10H7L4 10l8-7zM8 10h8M9 15h6',
  xin:'M12 3l7 6-3 10H8L5 9l7-6zM5 9h14M8 19l4-10 4 10',
  ren:'M2 9c3-3 5-3 8 0s5 3 8 0 4-2 4-2M2 14c3-3 5-3 8 0s5 3 8 0 4-2 4-2M4 19c2-2 4-2 6 0s4 2 6 0 4-2 4-2',
  gui:'M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13zM9 16c1 2 3 3 5 2',
}

const actionMeta:Record<TenGodKey,{name:string;copy:string}>={
  bi_jian:{name:'Criterio propio',copy:'Cuando algo te afecta directamente, necesitas sentir que la decisión final sigue siendo tuya.'},
  jie_cai:{name:'Contrapunto',copy:'Ver cómo alguien más resuelve algo te ayuda a descubrir qué harías tú distinto.'},
  shi_shen:{name:'Dar forma',copy:'Te sale desarrollar una idea, cuidarla y convertirla en algo que puedas compartir.'},
  shang_guan:{name:'Mejorar',copy:'Cuando ves algo que podría funcionar mejor, te cuesta dejarlo pasar sin decir nada.'},
  pian_cai:{name:'Detectar oportunidades',copy:'Notas rápido una posibilidad nueva y quieres averiguar hasta dónde puede llegar.'},
  zheng_cai:{name:'Volverlo concreto',copy:'Antes de comprometer trabajo o dinero, necesitas saber qué va a salir de ahí.'},
  qi_sha:{name:'Responder al reto',copy:'Cuando algo se complica, aparece una versión más decidida y directa de ti.'},
  zheng_guan:{name:'Ordenar',copy:'Con responsabilidades y reglas claras, te resulta mucho más fácil avanzar.'},
  pian_yin:{name:'Conectar señales',copy:'Guardas detalles pequeños y los recuperas cuando necesitas encontrar una salida.'},
  zheng_yin:{name:'Comprender primero',copy:'Te sirve entender bien cómo funciona algo antes de empezar a mover piezas.'},
}

function loadLibrary():SavedMap[]{
  try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}
}
function persist(items:SavedMap[]){localStorage.setItem(STORE,JSON.stringify(items))}
function id(){return globalThis.crypto?.randomUUID?.()||`map-${Date.now()}`}
function encodeJourney(input:BirthInput,step:number){
  const json=JSON.stringify({v:1,input,step})
  const bytes=new TextEncoder().encode(json)
  let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte))
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
}
function decodeJourney(value:string){
  try{const base=value.replaceAll('-','+').replaceAll('_','/');const binary=atob(base);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes)) as {input:BirthInput;step:number}}catch{return null}
}
function makeUrl(input:BirthInput,step:number){const url=new URL(window.location.href);url.search='';url.searchParams.set('c',encodeJourney(input,step));return url.toString()}

function Glyph({stem,size=64}:{stem:StemKey;size?:number}){
  return <span className="glyph" style={{'--glyph-size':`${size}px`} as CSSProperties} aria-hidden="true"><svg viewBox="0 0 24 24"><path d={iconPaths[stem]}/></svg></span>
}

function ElementMark({element}:{element:ElementKey}){
  return <span className={`elementMark element-${element}`} aria-hidden="true"><i/><i/><i/></span>
}

function Brand(){return <div className="brand"><span>十</span><b>MI MAPA</b></div>}

export default function App(){
  const shared=useMemo(()=>new URLSearchParams(location.search).get('c'),[])
  const sharedJourney=useMemo(()=>shared?decodeJourney(shared):null,[shared])
  const [library,setLibrary]=useState<SavedMap[]>(loadLibrary)
  const [active,setActive]=useState<BirthInput|null>(sharedJourney?.input||null)
  const [view,setView]=useState<View>(sharedJourney?'stories':library.length?'home':'form')
  const [storyStep,setStoryStep]=useState(sharedJourney?.step||0)
  const [toast,setToast]=useState('')
  const chart=useMemo(()=>active?calculateChart(active):null,[active])
  const theme=chart?elementMeta[chart.dayMaster.element]:null
  const style=theme?{'--accent':theme.color,'--accent-dark':theme.dark,'--accent-soft':theme.soft} as CSSProperties:undefined

  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(timer)},[toast])
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(view!=='stories')return
      if(event.key==='ArrowRight'||event.key==='Enter')setStoryStep(x=>Math.min(storyCount(chart)-1,x+1))
      if(event.key==='ArrowLeft')setStoryStep(x=>Math.max(0,x-1))
      if(event.key==='Escape')setView('reading')
    }
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)
  },[view,chart])

  const save=(input:BirthInput,completed=false)=>{
    const existing=library.find(x=>x.input.date===input.date&&x.input.time===input.time&&x.input.name===input.name)
    const entry:SavedMap={id:existing?.id||id(),label:input.name?.trim()||'Mi mapa',input,createdAt:existing?.createdAt||Date.now(),completed:completed||existing?.completed||false}
    const next=existing?library.map(x=>x.id===existing.id?entry:x):[entry,...library]
    setLibrary(next);persist(next);return entry
  }
  const start=(input:BirthInput)=>{save(input);setActive(input);setStoryStep(0);setView('stories');window.scrollTo(0,0)}
  const open=(item:SavedMap,target:View='reading')=>{setActive(item.input);setView(target);setStoryStep(0);window.scrollTo(0,0)}
  const finish=()=>{if(active)save(active,true);setView('reading');window.scrollTo(0,0)}
  const remove=(mapId:string)=>{if(!confirm('¿Eliminar esta carta de este dispositivo?'))return;const next=library.filter(x=>x.id!==mapId);setLibrary(next);persist(next)}

  return <div className={`app ${chart?`theme-${chart.dayMaster.element}`:'theme-neutral'}`} style={style}>
    <Watercolor/>
    {view==='home'&&<Home library={library} onOpen={open} onNew={()=>setView('form')} onDelete={remove}/>} 
    {view==='form'&&<BirthForm onSubmit={start} onBack={library.length?()=>setView('home'):undefined}/>} 
    {view==='stories'&&chart&&<Stories chart={chart} step={storyStep} setStep={setStoryStep} onClose={finish} onSave={()=>saveLater(active!,storyStep,setToast)} onFinish={finish}/>} 
    {view==='reading'&&chart&&<Reading chart={chart} onHome={()=>setView('home')} onReplay={()=>{setStoryStep(0);setView('stories')}}/>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div>
}

function Watercolor(){return <div className="watercolor" aria-hidden="true"><i/><i/><i/><i/><i/></div>}

function Home({library,onOpen,onNew,onDelete}:{library:SavedMap[];onOpen:(x:SavedMap,v?:View)=>void;onNew:()=>void;onDelete:(id:string)=>void}){
  return <main className="shell home">
    <header className="topbar"><Brand/><button className="roundButton" onClick={onNew} aria-label="Crear otra carta">＋</button></header>
    <section className="homeHero"><p className="eyebrow">QUÉ BUENO VERTE OTRA VEZ</p><h1>Tus mapas,<br/><em>siempre contigo.</em></h1><p>Aquí puedes volver a tu lectura, descargar tus imágenes o crear una carta para alguien más.</p></section>
    <div className="libraryGrid">
      {library.map(item=>{const c=calculateChart(item.input),identity=identityMeta[c.dayMaster.stem],meta=elementMeta[c.dayMaster.element];return <article className="mapCard" key={item.id} style={{'--card':meta.color,'--card-soft':meta.soft} as CSSProperties}>
        <div className="cardGlow"/><button className="mapMain" onClick={()=>onOpen(item)}><Glyph stem={c.dayMaster.stem} size={58}/><span><small>{item.completed?'TU LECTURA':'LECTURA GUARDADA'}</small><strong>{item.label}</strong><em>{identity.name} · {meta.label} {c.dayMaster.polarity==='yin'?'Yin':'Yang'}</em></span></button>
        <div className="cardActions"><button onClick={()=>onOpen(item,'stories')}>Volver a las historias</button><button className="delete" onClick={()=>onDelete(item.id)}>Eliminar</button></div>
      </article>})}
    </div>
    <button className="primary wide" onClick={onNew}>Crear otra carta <span>→</span></button>
  </main>
}

function BirthForm({onSubmit,onBack}:{onSubmit:(x:BirthInput)=>void;onBack?:()=>void}){
  const [name,setName]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[place,setPlace]=useState(''),[dst,setDst]=useState(false),[error,setError]=useState('')
  const submit=(event:FormEvent)=>{event.preventDefault();if(!date||!time||!place.trim()){setError('Completa fecha, hora y lugar para calcular tu carta.');return}setError('');onSubmit({name:name.trim(),date,time,place:place.trim(),timezone:'America/Mexico_City',dstAdjustment:dst})}
  return <main className="shell formPage">
    <header className="topbar">{onBack?<button className="back" onClick={onBack}>← Tus cartas</button>:<Brand/>}<span className="stepLabel">PRIMER PASO</span></header>
    <section className="formIntro"><p className="eyebrow">TU MOMENTO DE NACER</p><h1>Empecemos<br/><em>por ti.</em></h1><p>Con estos datos ubicamos los cuatro ritmos que estaban activos cuando naciste. Todo se calcula aquí, sin enviar tu información a ningún servidor.</p></section>
    <form className="birthForm" onSubmit={submit}>
      <label>¿Cómo te llamas? <span>Opcional</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre o apodo" autoComplete="name"/></label>
      <div className="fieldRow"><label>Fecha de nacimiento<input type="date" value={date} onChange={e=>setDate(e.target.value)} min="1900-01-01" max="2050-12-31" required/></label><label>Hora de nacimiento<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label></div>
      <label>Lugar de nacimiento<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Ciudad, estado y país" required/></label>
      <label className="check"><input type="checkbox" checked={dst} onChange={e=>setDst(e.target.checked)}/><span><b>Había horario de verano</b><small>Actívalo si el reloj se adelantaba una hora en tu fecha y ciudad.</small></span></label>
      {error&&<p className="formError" role="alert">{error}</p>}
      <button className="primary wide" type="submit">Descubrir mi mapa <span>→</span></button>
    </form>
    <details className="examples"><summary>Usar una carta de ejemplo</summary><div><button onClick={()=>onSubmit(fixtures.eber)}>Probar Eber</button><button onClick={()=>onSubmit(fixtures.anju)}>Probar Anju</button></div></details>
  </main>
}

function storyCount(chart:Chart|null){return chart?18:1}
function Stories({chart,step,setStep,onClose,onSave,onFinish}:{chart:Chart;step:number;setStep:(n:number)=>void;onClose:()=>void;onSave:()=>void;onFinish:()=>void}){
  const total=storyCount(chart),identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0]
  const next=()=>step===total-1?onFinish():setStep(Math.min(total-1,step+1)),prev=()=>setStep(Math.max(0,step-1))
  useEffect(()=>{if(step!==0)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const timer=setTimeout(()=>setStep(1),reduced?250:2300);return()=>clearTimeout(timer)},[step,setStep])
  let content:ReactNode
  if(step===0) content=<LoadingStory/>
  else if(step===1) content=<StoryCenter kicker="ESTE ERES TÚ"><Glyph stem={chart.dayMaster.stem} size={96}/><h1>{identity.name}</h1><p>{identity.caption}</p><Technical>{stems[chart.dayMaster.stem].label} · Día Maestro</Technical></StoryCenter>
  else if(step===2) content=<StoryQuote kicker="TU PERFIL PRINCIPAL" title={identity.headline} body={`${identity.body} ${identity.friction}`}/>
  else if(step===3) content=<StoryQuote kicker="TU CARTA TIENE CUATRO VOCES" title="No eres una sola etiqueta." body="El año, el mes, el día y la hora cuentan cómo te mueves en distintos espacios. Juntos forman una imagen mucho más completa que el signo del año que quizá ya conocías." extra={<FourDots/>}/>
  else if(step>=4&&step<=7){const key=PILLAR_ORDER[step-4],pillar=chart.pillars[key],reading=pillarReading(key,pillar);content=<PillarStory pillarKey={key} chart={chart} title={reading.headline} body={reading.body}/>} 
  else if(step===8) content=<ProfilesStory chart={chart}/>
  else if(step===9) content=<StoryQuote kicker="TUS CINCO RECURSOS" title="Todos tenemos los cinco elementos. Lo que cambia es cuánto recurres a cada uno." body="No miden si eres buena o mala en algo. Muestran qué maneras de actuar aparecen solas y cuáles necesitan más intención." extra={<ElementRow chart={chart}/>}/>
  else if(step===10) content=<ElementStory element={strong} label="TU RECURSO MÁS DISPONIBLE" count={chart.elements[strong]} strongest/>
  else if(step===11) content=<ElementStory element={low} label="EL QUE PIDE MÁS INTENCIÓN" count={chart.elements[low]}/>
  else if(step===12) content=<ElementsStory chart={chart}/>
  else if(step===13) content=<ActionsStory chart={chart}/>
  else if(step===14) content=<InteractionsStory chart={chart}/>
  else if(step===15) content=<StoryQuote kicker="HAY UN ESPACIO EN BLANCO" title="Tienes un vacío. Y no: no significa que te falte algo." body="En BaZi, un vacío marca una parte de la vida que no se sostiene en automático. Suele pedir experiencia propia, prueba y una definición menos heredada." extra={<span className="voidRing" aria-hidden="true"/>}/>
  else if(step===16){const copy=voidReading(chart);content=<StoryQuote kicker="ASÍ APARECE EN TU MAPA" title={copy.title} body={copy.body} extra={<Technical>{chart.voidBranches.map(x=>branches[x].label).join(' · ')}</Technical>}/>} 
  else content=<FinalStory chart={chart}/>
  return <main className="storyShell">
    <div className="progress" aria-label={`Historia ${step+1} de ${total}`}>{Array.from({length:total},(_,i)=><i key={i} className={i<=step?'done':''}/>)}</div>
    <Brand/><button className="storyClose" onClick={onClose} aria-label="Saltar historias y abrir la lectura completa">×</button>
    <section className={`story story-${step}`} key={step}>{content}</section>
    <div className="storyNav"><button onClick={prev} disabled={step===0} aria-label="Historia anterior">←</button><div><button className="later" onClick={onSave}>Verlo más tarde</button><button className="next" onClick={next}>{step===total-1?'Quiero saber más':'Continuar'} <span>→</span></button></div></div>
  </main>
}

function LoadingStory(){return <StoryCenter kicker="UNA TRADICIÓN DE MÁS DE MIL AÑOS"><div className="loader"><i/><i/><i/><span>十</span></div><h2>Ordenando tu mapa</h2><p>Estamos ubicando los ritmos del año, mes, día y hora en que naciste.</p></StoryCenter>}
function StoryCenter({kicker,children}:{kicker:string;children:ReactNode}){return <div className="storyCenter"><p className="eyebrow">{kicker}</p>{children}</div>}
function StoryQuote({kicker,title,body,extra}:{kicker:string;title:string;body:string;extra?:ReactNode}){return <div className="storyCopy"><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{body}</p>{extra}</div>}
function Technical({children}:{children:ReactNode}){return <small className="technical">DATO TÉCNICO · {children}</small>}
function FourDots(){return <div className="fourDots" aria-hidden="true"><i/><i/><i/><i/></div>}

function PillarStory({pillarKey,chart,title,body}:{pillarKey:PillarKey;chart:Chart;title:string;body:string}){
  const pillar=chart.pillars[pillarKey],meta=pillarMeta[pillarKey],identity=identityMeta[pillar.stem]
  return <div className="pillarStory"><p className="eyebrow">{meta.eyebrow.toUpperCase()}</p><div className="pillarHero"><Glyph stem={pillar.stem} size={80}/><div><small>{meta.title}</small><h2>{identity.name}</h2><em>{branches[pillar.branch].label}</em></div></div><h3>{title}</h3><p>{body}</p><Technical>{pillarLabel(pillar)}</Technical></div>
}
function MiniProfile({pillarKey,chart}:{pillarKey:PillarKey;chart:Chart}){const p=chart.pillars[pillarKey],i=identityMeta[p.stem];return <div className="miniProfile"><Glyph stem={p.stem} size={40}/><small>{pillarMeta[pillarKey].eyebrow}</small><b>{i.name}</b><span>{branches[p.branch].label}</span></div>}
function ProfilesStory({chart}:{chart:Chart}){return <div className="profilesStory"><p className="eyebrow">TUS CUATRO PERFILES</p><h2>Distintos espacios.<br/>La misma persona.</h2><div className="profilesGrid">{PILLAR_ORDER.map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><p>{profileSummary(chart)}</p><ShareButton kind="profiles" chart={chart}>Compartir mis perfiles</ShareButton></div>}
function ElementRow({chart}:{chart:Chart}){const max=Math.max(...Object.values(chart.elements));return <div className="elementRow">{ELEMENT_ORDER.map(element=><div key={element}><ElementMark element={element}/><i style={{height:`${28+chart.elements[element]/max*72}px`}}/><small>{elementMeta[element].label}</small></div>)}</div>}
function ElementStory({element,label,count,strongest=false}:{element:ElementKey;label:string;count:number;strongest?:boolean}){const meta=elementMeta[element];return <StoryCenter kicker={label}><ElementMark element={element}/><h1>{meta.label}</h1><p>{strongest?`${meta.sentence} Es una respuesta a la que vuelves con facilidad.`:`${meta.sentence} No está ausente: simplemente funciona mejor cuando la eliges de forma consciente.`}</p><Technical>{count} puntos relativos en tu carta</Technical></StoryCenter>}
function ElementsStory({chart}:{chart:Chart}){return <div className="elementsStory"><p className="eyebrow">TU MEZCLA, DE UN VISTAZO</p><h2>No necesitas equilibrio perfecto.<br/>Necesitas conocer tu mezcla.</h2><ElementRow chart={chart}/><p>Lo alto es acceso fácil. Lo bajo es práctica consciente. Ningún elemento es premio ni castigo.</p><ShareButton kind="elements" chart={chart}>Compartir mi gráfica</ShareButton></div>}

function topActions(chart:Chart){return (Object.entries(chart.tenGods) as [TenGodKey,number][]).sort((a,b)=>b[1]-a[1]).slice(0,3)}
function ActionsStory({chart}:{chart:Chart}){return <div className="actionsStory"><p className="eyebrow">TUS FORMAS DE ACTUAR</p><h2>Cuando algo importa,<br/>estas respuestas aparecen primero.</h2><div className="actionList">{topActions(chart).map(([key,value],i)=><article key={key}><span>0{i+1}</span><div><b>{actionMeta[key].name}</b><p>{actionMeta[key].copy}</p></div><em>{value}</em></article>)}</div><ShareButton kind="actions" chart={chart}>Compartir mis formas de actuar</ShareButton></div>}
function InteractionsStory({chart}:{chart:Chart}){const data=chart.interactions[0]?interactionReading(chart.interactions[0]):{title:'Tus cuatro ritmos no compiten por el volante',body:'No aparece una interacción principal entre tus cuatro ramas. Eso no significa una vida sin fricción; significa que ningún choque o armonía domina esta primera lectura.'};return <div className="interactionStory"><p className="eyebrow">LO QUE PASA CUANDO TUS PARTES SE ENCUENTRAN</p><div className="orbit" aria-hidden="true"><i/><i/><span>十</span></div><h2>{data.title}</h2><p>{data.body}</p>{chart.interactions[0]&&<Technical>{chart.interactions[0].kind} · {chart.interactions[0].note}</Technical>}</div>}
function FinalStory({chart}:{chart:Chart}){const identity=identityMeta[chart.dayMaster.stem],voidCopy=voidReading(chart);return <div className="finalStory"><p className="eyebrow">ESTE ERES TÚ</p><div className="finalCard"><Glyph stem={chart.dayMaster.stem} size={74}/><small>TU MAPA EN UNA IMAGEN</small><h2>{identity.name}</h2><p>{identity.headline}</p><div className="finalProfiles">{PILLAR_ORDER.map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><span>{voidCopy.title}</span></div><ShareButton kind="summary" chart={chart}>Descargar y compartir</ShareButton></div>}

async function saveLater(input:BirthInput,step:number,notify:(x:string)=>void){
  const url=makeUrl(input,step)
  window.history.replaceState({},'',url)
  try{await navigator.clipboard.writeText(url);notify('Enlace copiado. Puedes volver exactamente a esta parte.')}catch{notify('Listo. La dirección de esta página ya guarda tu avance.')}
}

function ShareButton({kind,chart,children}:{kind:ShareKind;chart:Chart;children:ReactNode}){
  const [busy,setBusy]=useState(false)
  const act=async()=>{setBusy(true);try{await shareImage(chart,kind)}finally{setBusy(false)}}
  return <button className="shareButton" onClick={act} disabled={busy}>{busy?'Preparando imagen…':children} <span>↗</span></button>
}

async function shareImage(chart:Chart,kind:ShareKind){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
  const ctx=canvas.getContext('2d')!,meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem]
  const gradient=ctx.createLinearGradient(0,0,1080,1350);gradient.addColorStop(0,'#fbf7f0');gradient.addColorStop(.48,meta.soft);gradient.addColorStop(1,'#f4e0d6');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1350)
  for(let i=0;i<12;i++){ctx.globalAlpha=.06;ctx.fillStyle=i%2?meta.color:'#ffffff';ctx.beginPath();ctx.arc((i*317)%1080,(i*191)%1350,110+(i%4)*52,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
  ctx.fillStyle='rgba(255,255,255,.72)';roundRect(ctx,70,70,940,1210,52);ctx.fill()
  ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font='600 22px Arial';ctx.fillText('MI MAPA · ESTE ERES TÚ',540,130)
  ctx.font='italic 700 96px Georgia';ctx.fillText(kind==='elements'?'MIS CINCO ELEMENTOS':kind==='actions'?'ASÍ ACTÚO':identity.name,540,260)
  if(kind==='profiles'||kind==='summary'){
    ctx.font='600 30px Arial';ctx.fillText(identity.headline,540,335,830)
    PILLAR_ORDER.forEach((key,index)=>{const p=chart.pillars[key],x=120+index*225;ctx.fillStyle='rgba(255,255,255,.66)';roundRect(ctx,x,430,190,285,28);ctx.fill();ctx.fillStyle=elementMeta[stems[p.stem].element].color;ctx.beginPath();ctx.arc(x+95,500,38,0,Math.PI*2);ctx.fill();ctx.fillStyle=meta.dark;ctx.font='700 18px Arial';ctx.fillText(pillarMeta[key].eyebrow.toUpperCase(),x+95,575);ctx.font='600 31px Georgia';ctx.fillText(identityMeta[p.stem].name,x+95,625);ctx.font='20px Arial';ctx.fillText(branches[p.branch].label,x+95,666)})
  }
  if(kind==='elements'||kind==='summary'){
    const max=Math.max(...Object.values(chart.elements)),baseY=kind==='summary'?930:620
    ELEMENT_ORDER.forEach((element,index)=>{const x=165+index*188,h=chart.elements[element]/max*340;ctx.fillStyle=elementMeta[element].color;roundRect(ctx,x-38,baseY+350-h,76,h,38);ctx.fill();ctx.fillStyle=meta.dark;ctx.font='700 17px Arial';ctx.fillText(elementMeta[element].label.toUpperCase(),x,baseY+395)})
  }
  if(kind==='actions'){
    topActions(chart).forEach(([key,value],index)=>{const y=425+index*225;ctx.fillStyle='rgba(255,255,255,.68)';roundRect(ctx,125,y,830,180,30);ctx.fill();ctx.fillStyle=meta.color;ctx.beginPath();ctx.arc(190,y+90,38,0,Math.PI*2);ctx.fill();ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font='700 33px Georgia';ctx.fillText(actionMeta[key].name,255,y+65);ctx.font='23px Arial';wrapCanvasText(ctx,actionMeta[key].copy,255,y+105,630,31);ctx.textAlign='center';ctx.font='700 18px Arial';ctx.fillText(String(value),190,y+97)})
  }
  ctx.fillStyle=meta.dark;ctx.font='italic 600 27px Georgia';ctx.fillText('No es una sentencia. Es una forma de observarte.',540,1210)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('No se pudo crear la imagen')),'image/png'))
  const file=new File([blob],`mi-mapa-${kind}.png`,{type:'image/png'})
  const localPreview=['127.0.0.1','localhost'].includes(location.hostname)
  if(!localPreview&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Mi Mapa',text:'Este es mi mapa BaZi, explicado en palabras cotidianas.'});return}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function wrapCanvasText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){const words=text.split(' ');let line='';for(const word of words){const test=`${line}${word} `;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=`${word} `;y+=lineHeight}else line=test}ctx.fillText(line,x,y)}

function Reading({chart,onHome,onReplay}:{chart:Chart;onHome:()=>void;onReplay:()=>void}){
  const identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0],voidCopy=voidReading(chart)
  return <main className="reading">
    <header className="readingTop"><button onClick={onHome}>← Tus cartas</button><Brand/><button onClick={onReplay}>Ver historias</button></header>
    <section className="readingHero"><div><p className="eyebrow">ESTE ERES TÚ</p><h1>{identity.name}</h1><p>{identity.headline}</p><Technical>{stems[chart.dayMaster.stem].label} · {chart.dayMaster.strength}</Technical></div><Glyph stem={chart.dayMaster.stem} size={160}/></section>
    <nav className="sectionNav" aria-label="Secciones de tu lectura"><a href="#perfiles">Perfiles</a><a href="#elementos">Elementos</a><a href="#acciones">Cómo actúas</a><a href="#encuentros">Encuentros</a><a href="#vacio">Vacío</a></nav>
    <section className="readingSection introReading"><p>{identity.body}</p><p>{identity.friction}</p></section>
    <section className="readingSection" id="perfiles"><SectionHead number="01" kicker="TUS CUATRO PERFILES" title="Quién eres cambia de matiz según el espacio."/><div className="longProfiles">{PILLAR_ORDER.map(key=>{const p=chart.pillars[key],r=pillarReading(key,p);return <article key={key}><div><Glyph stem={p.stem} size={58}/><span><small>{pillarMeta[key].eyebrow}</small><h3>{identityMeta[p.stem].name}</h3><em>{pillarMeta[key].title}</em></span></div><p>{r.body}</p><Technical>{pillarLabel(p)}</Technical></article>})}</div><ShareButton kind="profiles" chart={chart}>Descargar mis perfiles</ShareButton></section>
    <section className="readingSection" id="elementos"><SectionHead number="02" kicker="TU MEZCLA" title="Cinco maneras de responder a la vida."/><div className="elementFeature"><div><small>MÁS DISPONIBLE</small><ElementMark element={strong}/><h3>{elementMeta[strong].label}</h3><p>{elementMeta[strong].sentence}</p></div><div><small>PIDE MÁS INTENCIÓN</small><ElementMark element={low}/><h3>{elementMeta[low].label}</h3><p>{elementMeta[low].sentence}</p></div></div><ElementRow chart={chart}/><ShareButton kind="elements" chart={chart}>Descargar mi gráfica</ShareButton></section>
    <section className="readingSection" id="acciones"><SectionHead number="03" kicker="CÓMO ACTÚAS" title="Tus respuestas más accesibles."/><div className="longActions">{topActions(chart).map(([key,value])=><article key={key}><span>{value}</span><div><h3>{actionMeta[key].name}</h3><p>{actionMeta[key].copy}</p></div></article>)}</div></section>
    <section className="readingSection" id="encuentros"><SectionHead number="04" kicker="CHOQUES Y ARMONÍAS" title="Lo que pasa cuando tus partes se encuentran."/><div className="interactionGrid">{chart.interactions.length?chart.interactions.map(item=>{const r=interactionReading(item);return <article key={item.id}><small>{item.kind}</small><h3>{r.title}</h3><p>{r.body}</p><Technical>{item.note}</Technical></article>}):<article><h3>No hay una interacción dominante.</h3><p>Tus cuatro ramas no forman un choque o armonía principal dentro de esta primera capa. Las etapas y fechas futuras sí pueden activar relaciones nuevas.</p></article>}</div></section>
    <section className="readingSection" id="vacio"><SectionHead number="05" kicker="TU VACÍO" title={voidCopy.title}/><div className="voidLong"><span className="voidRing"/><p>{voidCopy.body}</p></div></section>
    <section className="readingSection" id="palacios"><SectionHead number="06" kicker="TUS PALACIOS" title="Cuatro áreas donde se expresa tu carta."/><div className="palaces">{PILLAR_ORDER.map(key=><article key={key}><small>{pillarMeta[key].eyebrow}</small><h3>{pillarMeta[key].title}</h3><p>{pillarMeta[key].intro}</p></article>)}</div></section>
    <section className="readingSection downloads"><SectionHead number="07" kicker="PARA GUARDAR" title="Tu mapa también cabe en una imagen."/><div><ShareButton kind="summary" chart={chart}>Resumen completo</ShareButton><ShareButton kind="profiles" chart={chart}>Cuatro perfiles</ShareButton><ShareButton kind="elements" chart={chart}>Gráfica de elementos</ShareButton></div></section>
    <footer><Brand/><p>BaZi por dentro. Palabras de todos los días por fuera.</p><button onClick={onHome}>Volver a mis cartas</button></footer>
  </main>
}
function SectionHead({number,kicker,title}:{number:string;kicker:string;title:string}){return <header className="sectionHead"><span>{number}</span><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div></header>}
