import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import {
  branches, branchPace, calculateChart, elementMeta, identityMeta, interactionReading,
  lowestElement, pillarLabel, pillarMeta, pillarReading, profileSummary, strongestElement,
  stems, voidReading,
  type BirthInput, type Chart, type ElementKey, type PillarKey, type StemKey, type TenGodKey,
} from './engine'
import { locationLabel, searchLocations, type BirthLocation } from './locations'
import { cycleReading, dateKey, dayReading, formatLongDate, monthLabel, monthReading, partsFromKey, todayInZone } from './timeEngine'

type View = 'home'|'form'|'stories'|'reading'|'today'|'month'|'cycles'
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

const animalShapes:Record<keyof typeof branches,ReactNode>={
  rat:<><circle cx="9" cy="9" r="2.2"/><circle cx="15" cy="9" r="2.2"/><path d="M8 10.5c1-2 7-2 8 0 1 2 .5 5-4 7-4.5-2-5-5-4-7zM12 13v1M6 13h3M15 13h3"/></>,
  ox:<path d="M8 9C6 8 5 6 5 4c3 0 5 1 6 3M16 9c2-1 3-3 3-5-3 0-5 1-6 3M8 9c1-2 7-2 8 0v6c-1 3-7 3-8 0V9zM10 14h4"/>,
  tiger:<path d="M7 8 5 5l4 1M17 8l2-3-4 1M7 8c1-2 9-2 10 0v7c-2 3-8 3-10 0V8zM9 10h6M10 12h4M12 9v6"/>,
  rabbit:<path d="M9 9C7 6 7 2 9 2c2 0 2 4 2 7M15 9c2-3 2-7 0-7-2 0-2 4-2 7M8 10c1-2 7-2 8 0v5c-1 3-7 3-8 0v-5zM10 13h.1M14 13h.1"/>,
  dragon:<path d="M5 15c2-5 4-7 8-7 3 0 5 2 6 4-2-1-4 0-5 2-2 3-6 4-9 1zM10 8 8 5M14 8l2-3M17 11l2-1"/>,
  snake:<path d="M8 6c4-3 8-1 8 2 0 4-8 3-8 7 0 3 5 4 8 1M16 8h.1"/>,
  horse:<path d="M8 18V9l3-5 5 3v8c-1 3-5 4-8 3zM11 8h5M13 10h.1M8 11 5 9"/>,
  goat:<path d="M8 9C6 7 6 4 7 3c2 1 3 3 3 5M16 9c2-2 2-5 1-6-2 1-3 3-3 5M8 9c1-2 7-2 8 0v6c-2 3-6 3-8 0V9zM10 13h4"/>,
  monkey:<><circle cx="12" cy="12" r="6"/><circle cx="5.5" cy="12" r="2"/><circle cx="18.5" cy="12" r="2"/><path d="M9 11c1-2 5-2 6 0v4c-1 2-5 2-6 0v-4zM10 14h4"/></>,
  rooster:<path d="M9 18V8c2-3 6-3 8 0v6c-1 3-5 5-8 4zM11 6c0-2 2-3 3-1 1-2 3-1 3 1M17 9l3 2-3 1M7 10 4 8M7 13 4 14"/>,
  dog:<path d="M8 8 5 5v6M16 8l3-3v6M8 8c1-2 7-2 8 0v7c-1 3-7 3-8 0V8zM10 12h.1M14 12h.1M10 15h4"/>,
  pig:<path d="M7 9C8 6 16 6 17 9v6c-2 3-8 3-10 0V9zM8 8 6 5l4 2M16 8l2-3-4 2M9 13c1-2 5-2 6 0v2c-1 2-5 2-6 0v-2zM11 14h.1M13 14h.1"/>,
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
function AnimalGlyph({branch,size=54}:{branch:keyof typeof branches;size?:number}){
  return <span className="animalGlyph" style={{'--animal-size':`${size}px`} as CSSProperties} aria-hidden="true"><svg viewBox="0 0 24 24">{animalShapes[branch]}</svg></span>
}

function ElementMark({element}:{element:ElementKey}){
  return <span className={`elementMark element-${element}`} aria-hidden="true"><i/><i/><i/></span>
}

function Brand(){return <div className="brand"><span>十</span><b>MI MAPA</b></div>}

export default function App(){
  const shared=useMemo(()=>new URLSearchParams(location.search).get('c'),[])
  const route=useMemo(()=>new URLSearchParams(location.search).get('vista'),[])
  const routeView:View|null=route==='hoy'?'today':route==='mes'?'month':route==='ciclos'?'cycles':route==='carta'?'reading':null
  const sharedJourney=useMemo(()=>shared?decodeJourney(shared):null,[shared])
  const [library,setLibrary]=useState<SavedMap[]>(loadLibrary)
  const [active,setActive]=useState<BirthInput|null>(sharedJourney?.input||null)
  const [view,setView]=useState<View>(sharedJourney?(routeView||'stories'):library.length?'home':'form')
  const [storyStep,setStoryStep]=useState(sharedJourney?.step||0)
  const [toast,setToast]=useState('')
  const chart=useMemo(()=>active?calculateChart(active):null,[active])
  const theme=chart?elementMeta[chart.dayMaster.element]:null
  const style=theme?{'--accent':theme.color,'--accent-dark':theme.dark,'--accent-soft':theme.soft} as CSSProperties:undefined

  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(timer)},[toast])
  useEffect(()=>{
    const syncRoute=()=>{
      const params=new URLSearchParams(location.search),journey=params.get('c'),decoded=journey?decodeJourney(journey):null,route=params.get('vista')
      if(decoded)setActive(decoded.input)
      const next:View=decoded?(route==='hoy'?'today':route==='mes'?'month':route==='ciclos'?'cycles':route==='carta'?'reading':'stories'):library.length?'home':'form'
      setView(next);if(next==='stories'&&decoded)setStoryStep(decoded.step||0);window.scrollTo(0,0)
    }
    addEventListener('popstate',syncRoute);return()=>removeEventListener('popstate',syncRoute)
  },[library.length])
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
  const go=(target:View,input=active,replace=false)=>{
    if(input)setActive(input)
    setView(target);window.scrollTo(0,0)
    const url=new URL(window.location.href),routeName=target==='today'?'hoy':target==='month'?'mes':target==='cycles'?'ciclos':target==='reading'?'carta':''
    if(input&&target!=='home'&&target!=='form')url.searchParams.set('c',encodeJourney(input,target==='stories'?storyStep:0));else url.searchParams.delete('c')
    if(routeName)url.searchParams.set('vista',routeName);else url.searchParams.delete('vista')
    if(target!=='today')url.searchParams.delete('fecha')
    if(target!=='month')url.searchParams.delete('periodo')
    history[replace?'replaceState':'pushState']({},'',url)
  }
  const start=(input:BirthInput)=>{save(input);setStoryStep(0);go('stories',input)}
  const open=(item:SavedMap,target:View='reading')=>{setStoryStep(0);go(target,item.input)}
  const finish=()=>{if(active)save(active,true);go('reading',active,true)}
  const updateActive=(changes:Partial<BirthInput>)=>{if(!active)return;const next={...active,...changes};save(next);go(view,next,true)}
  const remove=(mapId:string)=>{if(!confirm('¿Eliminar esta carta de este dispositivo?'))return;const next=library.filter(x=>x.id!==mapId);setLibrary(next);persist(next)}

  return <div className={`app ${chart?`theme-${chart.dayMaster.element}`:'theme-neutral'}`} style={style}>
    <Watercolor/>
    {view==='home'&&<Home library={library} onOpen={open} onNew={()=>go('form',null)} onDelete={remove}/>} 
    {view==='form'&&<BirthForm onSubmit={start} onBack={library.length?()=>go('home',null):undefined}/>} 
    {view==='stories'&&chart&&<Stories chart={chart} step={storyStep} setStep={setStoryStep} onClose={finish} onSave={()=>saveLater(active!,storyStep,setToast)} onFinish={finish}/>} 
    {view==='reading'&&chart&&<Reading chart={chart} onHome={()=>go('home',null)} onReplay={()=>{setStoryStep(0);go('stories')}} onTool={target=>go(target)}/>}
    {view==='today'&&chart&&<TodayPage chart={chart} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)}/>}
    {view==='month'&&chart&&<MonthPage chart={chart} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)}/>}
    {view==='cycles'&&chart&&<CyclesPage chart={chart} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)} onSetSex={sex=>updateActive({sexAtBirth:sex})}/>}
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
        <div className="mapTools"><button onClick={()=>onOpen(item,'today')}><span>☀</span><b>Hoy</b><small>Tu oportunidad del día</small></button><button onClick={()=>onOpen(item,'month')}><span>◐</span><b>Tu mes</b><small>El foco de este mes</small></button><button onClick={()=>onOpen(item,'cycles')}><span>↻</span><b>Ciclos</b><small>Tu etapa actual</small></button></div>
        <div className="cardActions"><button onClick={()=>onOpen(item,'stories')}>Volver a las historias</button><button className="delete" onClick={()=>onDelete(item.id)}>Eliminar</button></div>
      </article>})}
    </div>
    <button className="primary wide" onClick={onNew}>Crear otra carta <span>→</span></button>
  </main>
}

function BirthForm({onSubmit,onBack}:{onSubmit:(x:BirthInput)=>void;onBack?:()=>void}){
  const [name,setName]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[place,setPlace]=useState(''),[selected,setSelected]=useState<BirthLocation|null>(null),[open,setOpen]=useState(false),[highlighted,setHighlighted]=useState(0),[error,setError]=useState('')
  const suggestions=useMemo(()=>searchLocations(place,7),[place])
  const choose=(location:BirthLocation)=>{setSelected(location);setPlace(locationLabel(location));setOpen(false);setHighlighted(0)}
  const submit=(event:FormEvent)=>{
    event.preventDefault()
    const location=selected||suggestions[0]
    if(!date||!time||!place.trim()){setError('Completa fecha, hora y lugar para calcular tu carta.');return}
    if(!location){setError('Elige una ciudad de la lista para poder ajustar la hora solar automáticamente.');setOpen(true);return}
    setError('');onSubmit({name:name.trim(),date,time,place:locationLabel(location),timezone:location.timezone,longitude:location.longitude})
  }
  return <main className="shell formPage">
    <header className="topbar">{onBack?<button className="back" onClick={onBack}>← Tus cartas</button>:<Brand/>}<span className="stepLabel">PRIMER PASO</span></header>
    <section className="formIntro"><p className="eyebrow">TU MOMENTO DE NACER</p><h1>Empecemos<br/><em>por ti.</em></h1><p>Con estos datos ubicamos los cuatro ritmos que estaban activos cuando naciste. Todo se calcula aquí, sin enviar tu información a ningún servidor.</p></section>
    <form className="birthForm" onSubmit={submit}>
      <label>¿Cómo te llamas? <span>Opcional</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre o apodo" autoComplete="name"/></label>
      <div className="fieldRow"><label>Fecha de nacimiento<input type="date" value={date} onChange={e=>setDate(e.target.value)} min="1900-01-01" max="2050-12-31" required/></label><label>Hora de nacimiento<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label></div>
      <label className="locationField">Lugar de nacimiento
        <input role="combobox" aria-expanded={open&&suggestions.length>0} aria-controls="location-options" aria-autocomplete="list" value={place} onChange={e=>{setPlace(e.target.value);setSelected(null);setOpen(true);setHighlighted(0)}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onKeyDown={event=>{
          if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);setHighlighted(value=>Math.min(suggestions.length-1,value+1))}
          if(event.key==='ArrowUp'){event.preventDefault();setHighlighted(value=>Math.max(0,value-1))}
          if(event.key==='Enter'&&open&&suggestions[highlighted]){event.preventDefault();choose(suggestions[highlighted])}
          if(event.key==='Escape')setOpen(false)
        }} placeholder="Empieza a escribir tu ciudad" autoComplete="off" required/>
        {open&&place.trim().length>1&&<ul className="locationOptions" id="location-options" role="listbox">{suggestions.length?suggestions.map((location,index)=><li key={`${location.city}-${location.timezone}`}><button type="button" role="option" aria-selected={index===highlighted} className={index===highlighted?'active':''} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(location)}><b>{location.city}</b><span>{location.country}</span></button></li>):<li className="noLocation">Prueba con la ciudad grande más cercana.</li>}</ul>}
        {selected&&<small className="solarHint">Listo: calcularemos automáticamente su horario histórico y la hora solar real.</small>}
      </label>
      {error&&<p className="formError" role="alert">{error}</p>}
      <button className="primary wide" type="submit">Descubrir mi mapa <span>→</span></button>
    </form>
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
  else if(step===3) content=<StoryQuote kicker="TU CARTA TIENE CUATRO VOCES" title="Tu personalidad cambia de matiz según el espacio." body="El año, el mes, el día y la hora cuentan cómo te mueves en distintos lugares de tu vida. Juntos forman una imagen mucho más completa que el signo del año que quizá ya conocías." extra={<FourDots/>}/>
  else if(step>=4&&step<=7){const key=PILLAR_ORDER[step-4],pillar=chart.pillars[key],reading=pillarReading(key,pillar);content=<PillarStory pillarKey={key} chart={chart} title={reading.headline} body={reading.body}/>} 
  else if(step===8) content=<ProfilesStory chart={chart}/>
  else if(step===9) content=<StoryQuote kicker="TUS CINCO RECURSOS" title="Todos tenemos los cinco elementos y recurrimos a cada uno con distinta facilidad." body="El elemento más alto suele aparecer con mayor facilidad. Los elementos más bajos también pueden desarrollarse con práctica. Cada elemento aporta un recurso diferente." extra={<ElementRow chart={chart}/>}/>
  else if(step===10) content=<ElementStory element={strong} label="TU RECURSO MÁS DISPONIBLE" count={chart.elements[strong]} strongest/>
  else if(step===11) content=<ElementStory element={low} label="EL QUE PIDE MÁS INTENCIÓN" count={chart.elements[low]}/>
  else if(step===12) content=<ElementsStory chart={chart}/>
  else if(step===13) content=<ActionsStory chart={chart}/>
  else if(step===14) content=<InteractionsStory chart={chart}/>
  else if(step===15) content=<StoryQuote kicker="HAY UN ESPACIO EN BLANCO" title="El vacío señala lo que construyes a tu manera." body="En BaZi, un vacío marca una parte de la vida que pide experiencia propia, prueba y una definición menos heredada." extra={<span className="voidRing" aria-hidden="true"/>}/>
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
function ProfilesStory({chart}:{chart:Chart}){return <div className="profilesStory"><p className="eyebrow">TUS CUATRO PERFILES</p><h2>Distintos espacios.<br/>La misma persona.</h2><div className="profilesGrid">{PILLAR_ORDER.map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><p>{profileSummary(chart)}</p><ShareActions kind="profiles" chart={chart} shareLabel="Compartir mis perfiles"/></div>}
function ElementRow({chart}:{chart:Chart}){const max=Math.max(...Object.values(chart.elements));return <div className="elementRow">{ELEMENT_ORDER.map(element=><div key={element}><ElementMark element={element}/><i style={{height:`${28+chart.elements[element]/max*72}px`}}/><small>{elementMeta[element].label}</small></div>)}</div>}
function ElementStory({element,label,strongest=false}:{element:ElementKey;label:string;count:number;strongest?:boolean}){const meta=elementMeta[element];return <StoryCenter kicker={label}><ElementMark element={element}/><h1>{meta.label}</h1><p>{strongest?`${meta.sentence} Es una respuesta a la que vuelves con facilidad.`:`${meta.sentence} Este recurso gana presencia cuando lo eliges y lo practicas de forma consciente.`}</p><Technical>{strongest?'Es el recurso que más se repite':'Es el recurso que menos se repite'}</Technical></StoryCenter>}
function ElementsStory({chart}:{chart:Chart}){return <div className="elementsStory"><p className="eyebrow">TU MEZCLA, DE UN VISTAZO</p><h2>Tus cinco elementos muestran los recursos que usas con mayor facilidad.</h2><ElementRow chart={chart}/><p>El elemento que tienes más alto lo puedes utilizar de forma más sencilla. Los elementos que tienes más bajos también los puedes trabajar. Ningún elemento es mejor que otro.</p><ShareActions kind="elements" chart={chart} shareLabel="Compartir mi gráfica"/></div>}

function topActions(chart:Chart){return (Object.entries(chart.tenGods) as [TenGodKey,number][]).sort((a,b)=>b[1]-a[1]).slice(0,3)}
function ActionsStory({chart}:{chart:Chart}){const labels=['Tu respuesta más automática','También muy disponible','Otro recurso cercano'];return <div className="actionsStory"><p className="eyebrow">TUS FORMAS DE ACTUAR</p><h2>Cuando algo importa,<br/>estas respuestas aparecen primero.</h2><div className="actionList">{topActions(chart).map(([key],i)=><article key={key}><span aria-hidden="true">→</span><div><small>{labels[i]}</small><b>{actionMeta[key].name}</b><p>{actionMeta[key].copy}</p></div></article>)}</div><ShareActions kind="actions" chart={chart} shareLabel="Compartir mis formas de actuar"/></div>}
function InteractionsStory({chart}:{chart:Chart}){const data=chart.interactions[0]?interactionReading(chart.interactions[0]):{title:'Tus cuatro ritmos avanzan con bastante independencia',body:'Tus ramas natales dejan espacio para que cada área responda con su propio ritmo. Las etapas y las fechas futuras pueden activar encuentros distintos.'};return <div className="interactionStory"><p className="eyebrow">LO QUE PASA CUANDO TUS PARTES SE ENCUENTRAN</p><div className="orbit" aria-hidden="true"><i/><i/><span>十</span></div><h2>{data.title}</h2><p>{data.body}</p>{chart.interactions[0]&&<Technical>{chart.interactions[0].kind} · {chart.interactions[0].note}</Technical>}</div>}
function FinalStory({chart}:{chart:Chart}){const identity=identityMeta[chart.dayMaster.stem],voidCopy=voidReading(chart);return <div className="finalStory"><p className="eyebrow">ESTE ERES TÚ</p><div className="finalCard"><Glyph stem={chart.dayMaster.stem} size={74}/><small>TU MAPA EN UNA IMAGEN</small><h2>{identity.name}</h2><p>{identity.headline}</p><div className="finalProfiles">{PILLAR_ORDER.map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><span>{voidCopy.title}</span></div><ShareActions kind="summary" chart={chart} shareLabel="Compartir mi mapa"/></div>}

async function saveLater(input:BirthInput,step:number,notify:(x:string)=>void){
  const url=makeUrl(input,step)
  window.history.replaceState({},'',url)
  try{await navigator.clipboard.writeText(url);notify('Enlace copiado. Puedes volver exactamente a esta parte.')}catch{notify('Listo. La dirección de esta página ya guarda tu avance.')}
}

function ShareActions({kind,chart,shareLabel}:{kind:ShareKind;chart:Chart;shareLabel:string}){return <div className="shareActions"><ShareButton kind={kind} chart={chart}>{shareLabel}</ShareButton><ShareButton kind={kind} chart={chart} downloadOnly>Descargar</ShareButton></div>}
function ShareButton({kind,chart,children,downloadOnly=false}:{kind:ShareKind;chart:Chart;children:ReactNode;downloadOnly?:boolean}){
  const [busy,setBusy]=useState(false)
  const act=async()=>{setBusy(true);try{await shareImage(chart,kind,downloadOnly)}finally{setBusy(false)}}
  return <button className={`shareButton ${downloadOnly?'downloadButton':''}`} onClick={act} disabled={busy}>{busy?(downloadOnly?'Descargando…':'Preparando imagen…'):children} <span>{downloadOnly?'↓':'↗'}</span></button>
}

async function shareImage(chart:Chart,kind:ShareKind,downloadOnly=false){
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
    topActions(chart).forEach(([key],index)=>{const y=425+index*225;ctx.fillStyle='rgba(255,255,255,.68)';roundRect(ctx,125,y,830,180,30);ctx.fill();ctx.fillStyle=meta.color;ctx.beginPath();ctx.arc(190,y+90,38,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='700 25px Arial';ctx.fillText('→',190,y+98);ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font='700 33px Georgia';ctx.fillText(actionMeta[key].name,255,y+65);ctx.font='23px Arial';wrapCanvasText(ctx,actionMeta[key].copy,255,y+105,630,31);ctx.textAlign='center'})
  }
  ctx.fillStyle=meta.dark;ctx.font='italic 600 27px Georgia';ctx.fillText('Una forma clara de observar cómo respondo.',540,1210)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('La imagen tardó demasiado en generarse')),'image/png'))
  const file=new File([blob],`mi-mapa-${kind}.png`,{type:'image/png'})
  const localPreview=['127.0.0.1','localhost'].includes(location.hostname)
  if(!downloadOnly&&!localPreview&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Mi Mapa',text:'Este es mi mapa BaZi, explicado en palabras cotidianas.'});return}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function wrapCanvasText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number){const words=text.split(' ');let line='';for(const word of words){const test=`${line}${word} `;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=`${word} `;y+=lineHeight}else line=test}ctx.fillText(line,x,y)}

function Reading({chart,onHome,onReplay,onTool}:{chart:Chart;onHome:()=>void;onReplay:()=>void;onTool:(view:View)=>void}){
  const identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0],voidCopy=voidReading(chart)
  return <main className="reading">
    <header className="readingTop"><button onClick={onHome}>← Tus cartas</button><Brand/><button onClick={onReplay}>Ver historias</button></header>
    <section className="readingHero"><div><p className="eyebrow">ESTE ERES TÚ</p><h1>{identity.name}</h1><p>{identity.headline}</p><Technical>{stems[chart.dayMaster.stem].label} · {chart.dayMaster.strength}</Technical></div><Glyph stem={chart.dayMaster.stem} size={160}/></section>
    <section className="readingSection introReading"><p>{identity.body}</p><p>{identity.friction}</p></section>
    <div className="readingBody">
      <aside className="readingRail"><p>EXPLORA TU MAPA</p><nav aria-label="Secciones de tu lectura">
        <a href="#perfiles"><i/>Tus cuatro perfiles<small>Cómo cambias según el espacio</small></a>
        <a href="#elementos"><i/>Tus elementos<small>Recursos fáciles y conscientes</small></a>
        <a href="#acciones"><i/>Cómo actúas<small>Lo que aparece primero</small></a>
        <a href="#encuentros"><i/>Encuentros<small>Choques y armonías internas</small></a>
        <a href="#vacio"><i/>Tu vacío<small>Lo que construyes a tu manera</small></a>
        <a href="#ahora"><i/>Tu momento actual<small>Hoy, mes y ciclo</small></a>
        <a href="#carta-completa"><i/>Carta completa<small>La estructura para ojos expertos</small></a>
      </nav></aside>
      <div className="readingContent">
        <section className="readingSection" id="perfiles"><SectionHead kicker="TUS CUATRO PERFILES" title="Quién eres cambia de matiz según el espacio."/><div className="longProfiles">{PILLAR_ORDER.map(key=>{const p=chart.pillars[key],r=pillarReading(key,p);return <article key={key}><div><Glyph stem={p.stem} size={58}/><span><small>{pillarMeta[key].eyebrow}</small><h3>{identityMeta[p.stem].name}</h3><em>{pillarMeta[key].title}</em></span></div><p>{r.body}</p><Technical>{pillarLabel(p)}</Technical></article>})}</div><ShareActions kind="profiles" chart={chart} shareLabel="Compartir mis perfiles"/></section>
        <section className="readingSection" id="elementos"><SectionHead kicker="TU MEZCLA" title="Cinco maneras de responder a la vida."/><div className="elementFeature"><div><small>MÁS DISPONIBLE</small><ElementMark element={strong}/><h3>{elementMeta[strong].label}</h3><p>{elementMeta[strong].sentence}</p></div><div><small>PIDE MÁS INTENCIÓN</small><ElementMark element={low}/><h3>{elementMeta[low].label}</h3><p>{elementMeta[low].sentence}</p></div></div><ElementRow chart={chart}/><ShareActions kind="elements" chart={chart} shareLabel="Compartir mi gráfica"/></section>
        <section className="readingSection" id="acciones"><SectionHead kicker="CÓMO ACTÚAS" title="Las respuestas que tienes más a la mano."/><div className="longActions">{topActions(chart).map(([key],index)=><article key={key}><span aria-hidden="true">→</span><div><small>{index===0?'APARECE PRIMERO':index===1?'TAMBIÉN MUY DISPONIBLE':'OTRO RECURSO CERCANO'}</small><h3>{actionMeta[key].name}</h3><p>{actionMeta[key].copy}</p></div></article>)}</div></section>
        <section className="readingSection" id="encuentros"><SectionHead kicker="CHOQUES Y ARMONÍAS" title="Lo que pasa cuando tus partes se encuentran."/><div className="interactionGrid">{chart.interactions.length?chart.interactions.map(item=>{const r=interactionReading(item);return <article key={item.id}><small>{item.kind}</small><h3>{r.title}</h3><p>{r.body}</p><Technical>{item.note}</Technical></article>}):<article><h3>Cada área conserva su propio ritmo.</h3><p>Tus cuatro ramas dejan espacio para que cada área responda de forma independiente. Las etapas y fechas futuras pueden activar relaciones nuevas.</p></article>}</div></section>
        <section className="readingSection" id="vacio"><SectionHead kicker="TU VACÍO" title={voidCopy.title}/><div className="voidLong"><span className="voidRing"/><p>{voidCopy.body}</p></div></section>
        <section className="readingSection" id="palacios"><SectionHead kicker="TUS PALACIOS" title="Cuatro áreas donde se expresa tu carta."/><div className="palaces">{PILLAR_ORDER.map(key=><article key={key}><small>{pillarMeta[key].eyebrow}</small><h3>{pillarMeta[key].title}</h3><p>{pillarMeta[key].intro}</p></article>)}</div></section>
        <TemporalStrip chart={chart} onTool={onTool}/>
        <ExpertChart chart={chart}/>
        <section className="readingSection downloads"><SectionHead kicker="PARA GUARDAR" title="Descarga cualquiera de tus imágenes."/><div><ShareButton kind="summary" chart={chart} downloadOnly>Resumen completo</ShareButton><ShareButton kind="profiles" chart={chart} downloadOnly>Cuatro perfiles</ShareButton><ShareButton kind="elements" chart={chart} downloadOnly>Gráfica de elementos</ShareButton></div></section>
      </div>
    </div>
    <footer><Brand/><p>BaZi por dentro. Palabras de todos los días por fuera.</p><button onClick={onHome}>Volver a mis cartas</button></footer>
  </main>
}
function ExpertChart({chart}:{chart:Chart}){
  const order:PillarKey[]=['year','month','day','hour']
  const [pick,setPick]=useState<{pillar:PillarKey;kind:'stem'|'branch'|'hidden';stem?:StemKey}>({pillar:'day',kind:'stem'})
  const pillar=chart.pillars[pick.pillar]
  const selectedStem=pick.kind==='hidden'?pick.stem!:pillar.stem
  const detail=pick.kind==='branch'
    ?{title:`${branches[pillar.branch].label}: tu ritmo de fondo`,body:branchPace[pillar.branch],technical:`Rama terrestre · ${elementMeta[branches[pillar.branch].element].label}`}
    :pick.kind==='hidden'
      ?{title:`${identityMeta[selectedStem].name} trabaja desde el fondo`,body:`Esta parte suele aparecer después de conocerte mejor. Funciona como un recurso interno: ${identityMeta[selectedStem].body.charAt(0).toLowerCase()+identityMeta[selectedStem].body.slice(1)}`,technical:`Energía de fondo · ${stems[selectedStem].label}`}
      :{title:identityMeta[selectedStem].headline,body:identityMeta[selectedStem].body,technical:`Tallo celestial ${stems[selectedStem].han} · ${stems[selectedStem].label}`}
  const correction=Math.round(chart.birth.solarCorrectionMinutes)
  return <section className="readingSection expertSection" id="carta-completa">
    <SectionHead kicker="TU CARTA COMPLETA" title="La estructura técnica, traducida para que sí se pueda leer."/>
    <p className="expertIntro">Esta es la carta que vería una persona experta. Toca cualquier símbolo para entender qué representa sin tener que aprenderte primero toda la nomenclatura.</p>
    <div className="solarReceipt"><span>HORA QUE ESCRIBISTE<b>{chart.birth.time}</b></span><i>→</i><span>HORA SOLAR USADA<b>{chart.birth.calculationTime}</b></span><small>{correction>=0?'+':''}{correction} min · horario histórico calculado automáticamente en {chart.birth.place}</small></div>
    <div className="expertChart" role="group" aria-label="Tus cuatro pilares completos">{order.map(key=>{const item=chart.pillars[key];return <article className={key==='day'?'dayColumn':''} key={key}>
      <header><small>{pillarMeta[key].eyebrow}</small><b>{pillarMeta[key].title}</b>{key==='day'&&<em>TU CENTRO</em>}</header>
      <button className="expertStem" aria-pressed={pick.pillar===key&&pick.kind==='stem'} onClick={()=>setPick({pillar:key,kind:'stem'})} style={{'--cell':elementMeta[stems[item.stem].element].soft,'--cell-dark':elementMeta[stems[item.stem].element].dark} as CSSProperties}><small>CIELO</small><Glyph stem={item.stem} size={46}/><strong>{identityMeta[item.stem].name}</strong><span>{stems[item.stem].han} · {stems[item.stem].label}</span></button>
      <button className="expertBranch" aria-pressed={pick.pillar===key&&pick.kind==='branch'} onClick={()=>setPick({pillar:key,kind:'branch'})} style={{'--cell':elementMeta[branches[item.branch].element].soft,'--cell-dark':elementMeta[branches[item.branch].element].dark} as CSSProperties}><small>TIERRA</small><AnimalGlyph branch={item.branch} size={58}/><strong>{branches[item.branch].label}</strong><span>{elementMeta[branches[item.branch].element].label}</span></button>
      <div className="hiddenStems"><small>ENERGÍA DE FONDO</small>{item.hidden.map(hidden=><button key={hidden} aria-pressed={pick.pillar===key&&pick.kind==='hidden'&&pick.stem===hidden} onClick={()=>setPick({pillar:key,kind:'hidden',stem:hidden})} style={{'--chip':elementMeta[stems[hidden].element].soft,'--chip-dark':elementMeta[stems[hidden].element].dark} as CSSProperties}><Glyph stem={hidden} size={20}/><span>{identityMeta[hidden].name}</span></button>)}</div>
      {chart.voidPillars.includes(key)&&<div className="voidBadge">○ Aquí toca tu vacío</div>}
    </article>})}</div>
    <aside className="expertExplanation" aria-live="polite">{pick.kind==='branch'?<AnimalGlyph branch={pillar.branch} size={52}/>:<Glyph stem={selectedStem} size={52}/>}<div><small>{pillarMeta[pick.pillar].eyebrow} · {pick.kind==='stem'?'lo visible':pick.kind==='branch'?'la base':'lo que opera detrás'}</small><h3>{detail.title}</h3><p>{detail.body}</p><Technical>{detail.technical}</Technical></div></aside>
  </section>
}

function TemporalStrip({chart,onTool}:{chart:Chart;onTool:(view:View)=>void}){
  const today=todayInZone(chart.birth.timezone),daily=dayReading(chart,today),parts=partsFromKey(today),monthly=monthReading(chart,parts.year,parts.month)
  const cycle=chart.birth.sexAtBirth?cycleReading(chart,chart.birth.sexAtBirth).current:null
  return <section className="readingSection temporalStrip" id="ahora"><SectionHead kicker="TU MOMENTO ACTUAL" title="Cada fecha activa una oportunidad diferente."/><div className="temporalCards">
    <button onClick={()=>onTool('today')}><AnimalGlyph branch={daily.pillar.branch}/><small>HOY</small><h3>{daily.rhythm}</h3><p>{daily.opportunity[0]} puede encontrar buen ritmo hoy.</p><span>Ver mi día →</span></button>
    <button onClick={()=>onTool('month')}><Glyph stem={monthly.pillar.stem} size={54}/><small>ESTE MES</small><h3>{monthly.area.title}</h3><p>{monthly.headline}</p><span>Ver mi mes →</span></button>
    <button onClick={()=>onTool('cycles')}><span className="cycleMark">↻</span><small>MI CICLO</small><h3>{cycle?cycle.title:'Tu etapa actual'}</h3><p>Cada diez años comienza una etapa con prioridades diferentes.</p><span>Ver mis ciclos →</span></button>
  </div></section>
}

function ToolHeader({onHome,onReading}:{onHome:()=>void;onReading:()=>void}){return <header className="toolHeader"><button onClick={onHome}>← Tus cartas</button><Brand/><button onClick={onReading}>Ver mi carta</button></header>}
function ToolTabs({current,onTool}:{current:View;onTool:(view:View)=>void}){return <nav className="toolTabs" aria-label="Herramientas de tiempo"><button aria-current={current==='today'?'page':undefined} onClick={()=>onTool('today')}>Hoy</button><button aria-current={current==='month'?'page':undefined} onClick={()=>onTool('month')}>Tu mes</button><button aria-current={current==='cycles'?'page':undefined} onClick={()=>onTool('cycles')}>Ciclos</button></nav>}

function TodayPage({chart,onHome,onReading,onTool}:{chart:Chart;onHome:()=>void;onReading:()=>void;onTool:(view:View)=>void}){
  const [selected,setSelected]=useState(()=>{const requested=new URLSearchParams(location.search).get('fecha');return requested&&/^\d{4}-\d{2}-\d{2}$/.test(requested)?requested:todayInZone(chart.birth.timezone)}),parts=partsFromKey(selected),reading=useMemo(()=>dayReading(chart,selected),[chart,selected])
  const days=new Date(Date.UTC(parts.year,parts.month,0)).getUTCDate(),offset=new Date(Date.UTC(parts.year,parts.month-1,1)).getUTCDay()
  const moveMonth=(delta:number)=>{const d=new Date(Date.UTC(parts.year,parts.month-1+delta,1));setSelected(dateKey(d.getUTCFullYear(),d.getUTCMonth()+1,1))}
  const today=todayInZone(chart.birth.timezone)
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set('fecha',selected);history.replaceState({},'',url)},[selected])
  return <main className="toolPage"><ToolHeader onHome={onHome} onReading={onReading}/><ToolTabs current="today" onTool={onTool}/>
    <section className="timeHero"><div><p className="eyebrow">TU CALENDARIO PERSONAL</p><h1>{reading.headline}</h1><p>{reading.body} {reading.personal}</p><Technical>{branches[reading.pillar.branch].label} · {stems[reading.pillar.stem].label}</Technical></div><AnimalGlyph branch={reading.pillar.branch} size={150}/></section>
    <section className="dayActions"><article><small>APROVECHA EL DÍA PARA</small><h2>{reading.opportunity[0]}</h2><ul>{reading.opportunity.map(item=><li key={item}>{item}</li>)}</ul></article><article><small>DEJA UN POCO MÁS DE MARGEN EN</small><h2>{reading.margin[0]}</h2><ul>{reading.margin.map(item=><li key={item}>{item}</li>)}</ul></article></section>
    <section className="calendarPanel"><header className="periodNav"><button onClick={()=>moveMonth(-1)} aria-label="Mes anterior">←</button><div><p className="eyebrow">ELIGE OTRO DÍA</p><h2>{monthLabel(parts.year,parts.month)}</h2></div><button onClick={()=>moveMonth(1)} aria-label="Mes siguiente">→</button></header><div className="calendarGrid">{['D','L','M','M','J','V','S'].map((day,index)=><small key={`${day}-${index}`}>{day}</small>)}{Array.from({length:offset},(_,i)=><i key={`empty-${i}`}/>) }{Array.from({length:days},(_,index)=>{const key=dateKey(parts.year,parts.month,index+1),day=dayReading(chart,key);return <button key={key} className={`${key===selected?'selected ':''}${key===today?'today':''}`} onClick={()=>setSelected(key)} aria-label={`${formatLongDate(key)}. ${day.rhythm}`}><b>{index+1}</b><AnimalGlyph branch={day.pillar.branch} size={25}/><span>{day.rhythm}</span></button>})}</div><button className="textButton" onClick={()=>setSelected(today)}>Volver a hoy</button></section>
  </main>
}

function MonthPage({chart,onHome,onReading,onTool}:{chart:Chart;onHome:()=>void;onReading:()=>void;onTool:(view:View)=>void}){
  const now=partsFromKey(todayInZone(chart.birth.timezone)),[period,setPeriod]=useState(()=>{const requested=new URLSearchParams(location.search).get('periodo');if(requested&&/^\d{4}-\d{2}$/.test(requested)){const [year,month]=requested.split('-').map(Number);return {year,month}}return {year:now.year,month:now.month}}),reading=useMemo(()=>monthReading(chart,period.year,period.month),[chart,period])
  const move=(delta:number)=>{const d=new Date(Date.UTC(period.year,period.month-1+delta,15));setPeriod({year:d.getUTCFullYear(),month:d.getUTCMonth()+1})}
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set('periodo',`${period.year}-${String(period.month).padStart(2,'0')}`);history.replaceState({},'',url)},[period])
  const openDay=(key:string)=>{const url=new URL(location.href);url.searchParams.set('fecha',key);history.replaceState({},'',url);onTool('today')}
  return <main className="toolPage"><ToolHeader onHome={onHome} onReading={onReading}/><ToolTabs current="month" onTool={onTool}/>
    <section className="timeHero monthHero"><div><p className="eyebrow">TU MES · {monthLabel(period.year,period.month)}</p><h1>{reading.headline}</h1><p>{reading.area.intro} {reading.personal}</p><Technical>{identityMeta[reading.pillar.stem].name} · {branches[reading.pillar.branch].label} · {stems[reading.pillar.stem].han} {stems[reading.pillar.stem].label}</Technical></div><Glyph stem={reading.pillar.stem} size={150}/></section>
    <div className="periodNav"><button onClick={()=>move(-1)}>← Mes anterior</button><button onClick={()=>setPeriod({year:now.year,month:now.month})}>Este mes</button><button onClick={()=>move(1)}>Mes siguiente →</button></div>
    <section className="monthLayout"><article className="monthFocus"><div><p className="eyebrow">PON LA ENERGÍA A TU FAVOR</p><h2>{reading.area.title}</h2><p>{reading.area.theme}</p></div><ol>{reading.area.actions.map(item=><li key={item}>{item}</li>)}</ol></article><div className="monthDetail"><article><small>PON ATENCIÓN</small><h3>Administra tu margen</h3><p>{reading.area.care}</p></article><article><small>FECHAS CON BUEN RITMO</small><h3>Tres oportunidades del mes</h3><div className="featuredDays">{reading.featured.map(day=><button key={day.date} onClick={()=>openDay(day.date)}><b>{partsFromKey(day.date).day}</b><span>{day.rhythm}</span><small>{day.opportunity[0]}</small></button>)}</div></article></div></section>
  </main>
}

function CyclesPage({chart,onHome,onReading,onTool,onSetSex}:{chart:Chart;onHome:()=>void;onReading:()=>void;onTool:(view:View)=>void;onSetSex:(sex:'female'|'male')=>void}){
  if(!chart.birth.sexAtBirth)return <main className="toolPage"><ToolHeader onHome={onHome} onReading={onReading}/><ToolTabs current="cycles" onTool={onTool}/><section className="cycleSetup"><span className="cycleMark">↻</span><p className="eyebrow">UN DATO PARA CALCULAR TUS CICLOS</p><h1>¿Qué sexo te registraron al nacer?</h1><p>El método tradicional usa este dato para definir la dirección de la secuencia de diez años. Se guarda únicamente dentro de esta carta.</p><div className="cycleChoices"><button onClick={()=>onSetSex('female')}>Mujer</button><button onClick={()=>onSetSex('male')}>Hombre</button></div></section></main>
  const reading=cycleReading(chart,chart.birth.sexAtBirth),current=reading.current
  return <main className="toolPage"><ToolHeader onHome={onHome} onReading={onReading}/><ToolTabs current="cycles" onTool={onTool}/>
    <section className="timeHero cycleHero"><div><p className="eyebrow">TU CICLO ACTUAL · {current.startYear}—{current.endYear}</p><h1>Tu ciclo actual es: {current.title}.</h1><p>{current.body}</p><Technical>{stems[current.pillar.stem].han} · {stems[current.pillar.stem].label} · {branches[current.pillar.branch].label}</Technical></div><AnimalGlyph branch={current.pillar.branch} size={150}/></section>
    <section className="cycleIntro"><p>Cada diez años comienza una etapa de vida con prioridades y recursos distintos. Tu secuencia empezó alrededor de los {reading.startAge} años.</p></section>
    <ol className="cycleTimeline">{reading.items.map(item=><li className={item.current?'current':''} key={item.startYear}><div className="cycleYears"><b>{item.startYear}</b><span>{item.endYear}</span><small>{item.startAge}—{item.endAge} años</small></div><AnimalGlyph branch={item.pillar.branch} size={50}/><div><small>{item.current?'AQUÍ ESTÁS AHORA':item.focus.toUpperCase()}</small><h2>{item.title}</h2><p>{item.body}</p></div></li>)}</ol>
  </main>
}
function SectionHead({kicker,title}:{kicker:string;title:string}){return <header className="sectionHead"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div></header>}
