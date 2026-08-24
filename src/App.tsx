import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  branches, branchPace, calculateChart, elementMeta, identityMeta, interactionReading,
  lowestElement, pillarLabel, pillarMeta, pillarReading, profileSummary, strongestElement,
  stems, voidReading,
  type AuxiliaryPillarKey, type BirthInput, type Chart, type ElementKey, type Pillar, type PillarKey, type StemKey, type TenGodKey,
} from './engine'
import { locationLabel, searchLocations, type BirthLocation } from './locations'
import { activities, classifyActivity, cycleReading, dateKey, dayReading, dayScoreLabel, formatLongDate, monthLabel, monthReading, partsFromKey, searchActivityYear, shiftDate, todayInZone, type ActivityKey } from './timeEngine'

type View = 'home'|'form'|'stories'|'reading'|'today'|'calendar'|'month'|'cycles'
type SavedMap = { id:string; label:string; input:BirthInput; createdAt:number; completed:boolean }
type ShareKind = 'identity'|'profiles'|'elements'|'actions'|'summary'|'today'

const STORE='mi-mapa.library.v1'
const PILLAR_ORDER:PillarKey[]=['hour','day','month','year']
const ELEMENT_ORDER:ElementKey[]=['wood','fire','earth','metal','water']
type TechnicalPillarKey=PillarKey|AuxiliaryPillarKey
const auxiliaryMeta:Record<AuxiliaryPillarKey,{title:string;eyebrow:string;intro:string}>={
  life:{title:'Palacio de Vida',eyebrow:'Tu vida',intro:'Cruza el año, el mes y la hora para mostrar otra firma personal dentro de tu carta.'},
  conception:{title:'Palacio de la Concepción',eyebrow:'Tu origen',intro:'Parte del pilar del mes y representa tu configuración más temprana.'},
}
const elementPortrait:Record<ElementKey,string>={
  wood:'Cuando algo todavía puede crecer, encuentras por dónde empezar y ajustas la ruta hasta hacerlo avanzar.',
  fire:'Cuando algo te entusiasma, se te nota: lo mueves, lo compartes y haces que otras personas miren hacia ahí.',
  earth:'Cuando te comprometes, sostienes el proceso y a la gente hasta encontrar cómo hacerlo funcionar.',
  metal:'Ves rápido qué sobra, qué falta y dónde poner el límite para que algo funcione mejor.',
  water:'Antes de moverte, observas, conectas detalles y encuentras una ruta que otras personas todavía pasan por alto.',
}
function profileOrder(chart:Chart){return chart.birth.timeUnknown?PILLAR_ORDER.filter(key=>key!=='hour'):PILLAR_ORDER}
function profileCountLabel(chart:Chart){return chart.birth.timeUnknown?'tres':'cuatro'}
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

const menuItems:{view:View;label:string;hint:string;mark:string}[]=[
  {view:'reading',label:'Mi lectura',hint:'Tu carta completa',mark:'十'},
  {view:'today',label:'Hoy',hint:'Tu oportunidad del día',mark:'☀'},
  {view:'calendar',label:'Calendario',hint:'Explora y busca fechas',mark:'▦'},
  {view:'month',label:'Tu mes',hint:'El foco de este mes',mark:'◐'},
  {view:'cycles',label:'Ciclos',hint:'Tu etapa actual',mark:'↻'},
  {view:'home',label:'Tus cartas',hint:'Cambia de mapa',mark:'←'},
]
function Brand({onNavigate}:{onNavigate?:(view:View)=>void}){
  if(!onNavigate)return <div className="brand"><span>十</span><b>MI MAPA</b></div>
  return <details className="brandMenu"><summary aria-label="Abrir el menú de Mi Mapa"><span className="brand"><span>十</span><b>MI MAPA</b></span><i>⌄</i></summary><nav aria-label="Ir a otra parte de Mi Mapa">{menuItems.map(item=><button key={item.view} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');onNavigate(item.view)}}><span>{item.mark}</span><b>{item.label}</b><small>{item.hint}</small></button>)}</nav></details>
}

export default function App(){
  const shared=useMemo(()=>new URLSearchParams(location.search).get('c'),[])
  const route=useMemo(()=>new URLSearchParams(location.search).get('vista'),[])
  const routeView:View|null=route==='hoy'?'today':route==='calendario'?'calendar':route==='mes'?'month':route==='ciclos'?'cycles':route==='carta'?'reading':null
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
      const next:View=decoded?(route==='hoy'?'today':route==='calendario'?'calendar':route==='mes'?'month':route==='ciclos'?'cycles':route==='carta'?'reading':'stories'):library.length?'home':'form'
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
    const url=new URL(window.location.href),routeName=target==='today'?'hoy':target==='calendar'?'calendario':target==='month'?'mes':target==='cycles'?'ciclos':target==='reading'?'carta':''
    if(input&&target!=='home'&&target!=='form')url.searchParams.set('c',encodeJourney(input,target==='stories'?storyStep:0));else url.searchParams.delete('c')
    if(routeName)url.searchParams.set('vista',routeName);else url.searchParams.delete('vista')
    if(target!=='today'&&target!=='calendar')url.searchParams.delete('fecha')
    if(target!=='month')url.searchParams.delete('periodo')
    if(target!=='calendar'){url.searchParams.delete('modo');url.searchParams.delete('actividad');url.searchParams.delete('anio')}
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
    {view==='today'&&chart&&active&&<TodayPage chart={chart} library={library} active={active} onSwitch={input=>go('today',input,true)} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)}/>}
    {view==='calendar'&&chart&&active&&<CalendarPage chart={chart} library={library} active={active} onSwitch={input=>go('calendar',input,true)} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)}/>}
    {view==='month'&&chart&&active&&<MonthPage chart={chart} library={library} active={active} onSwitch={input=>go('month',input,true)} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)}/>}
    {view==='cycles'&&chart&&active&&<CyclesPage chart={chart} library={library} active={active} onSwitch={input=>go('cycles',input,true)} onHome={()=>go('home',null)} onReading={()=>go('reading')} onTool={target=>go(target)} onSetSex={sex=>updateActive({sexAtBirth:sex})}/>}
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
        <div className="mapTools"><button onClick={()=>onOpen(item,'today')}><span>☀</span><b>Hoy</b><small>Tu oportunidad del día</small></button><button onClick={()=>onOpen(item,'calendar')}><span>▦</span><b>Calendario</b><small>Día, mes y buscar fechas</small></button><button onClick={()=>onOpen(item,'month')}><span>◐</span><b>Tu mes</b><small>El foco de este mes</small></button><button onClick={()=>onOpen(item,'cycles')}><span>↻</span><b>Ciclos</b><small>Tu etapa actual</small></button></div>
        <div className="cardActions"><button onClick={()=>onOpen(item,'stories')}>Volver a las historias</button><button className="delete" onClick={()=>onDelete(item.id)}>Eliminar</button></div>
      </article>})}
    </div>
    <button className="primary wide" onClick={onNew}>Crear otra carta <span>→</span></button>
  </main>
}

function BirthForm({onSubmit,onBack}:{onSubmit:(x:BirthInput)=>void;onBack?:()=>void}){
  const [name,setName]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[timeUnknown,setTimeUnknown]=useState(false),[place,setPlace]=useState(''),[selected,setSelected]=useState<BirthLocation|null>(null),[open,setOpen]=useState(false),[highlighted,setHighlighted]=useState(0),[error,setError]=useState('')
  const suggestions=useMemo(()=>searchLocations(place,7),[place])
  const choose=(location:BirthLocation)=>{setSelected(location);setPlace(locationLabel(location));setOpen(false);setHighlighted(0)}
  const submit=(event:FormEvent)=>{
    event.preventDefault()
    const location=selected||suggestions[0]
    if(!date||(!timeUnknown&&!time)||!place.trim()){setError(`Completa fecha, ${timeUnknown?'lugar':'hora y lugar'} para calcular tu carta.`);return}
    if(!location){setError('Elige una ciudad de la lista para poder ajustar la hora solar automáticamente.');setOpen(true);return}
    setError('');onSubmit({name:name.trim(),date,time:timeUnknown?'12:00':time,timeUnknown,place:locationLabel(location),timezone:location.timezone,longitude:location.longitude})
  }
  return <main className="shell formPage">
    <header className="topbar">{onBack?<button className="back" onClick={onBack}>← Tus cartas</button>:<Brand/>}<span className="stepLabel">PRIMER PASO</span></header>
    <section className="formIntro"><p className="eyebrow">TU MOMENTO DE NACER</p><h1>Empecemos<br/><em>por ti.</em></h1><p>Con estos datos ubicamos los ritmos del año, mes y día. Cuando conoces tu hora, también podemos sumar ese cuarto perfil. Todo se calcula dentro de tu dispositivo.</p></section>
    <form className="birthForm" onSubmit={submit}>
      <label>¿Cómo te llamas? <span>Opcional</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre o apodo" autoComplete="name"/></label>
      <div className="fieldRow"><label>Fecha de nacimiento<span className="nativeInputFrame"><input type="date" value={date} onChange={e=>setDate(e.target.value)} min="1900-01-01" max="2050-12-31" required/></span></label><label>Hora de nacimiento <span>{timeUnknown?'Hora abierta':''}</span><span className="nativeInputFrame"><input type="time" value={time} onChange={e=>setTime(e.target.value)} disabled={timeUnknown} required={!timeUnknown}/></span><button type="button" className="unknownTimeToggle" aria-pressed={timeUnknown} onClick={()=>{setTimeUnknown(value=>!value);setTime('')}}>{timeUnknown?'Ingresar una hora':'No conozco mi hora'}</button></label></div>
      <label className="locationField">Lugar de nacimiento
        <input role="combobox" aria-expanded={open&&suggestions.length>0} aria-controls="location-options" aria-autocomplete="list" value={place} onChange={e=>{setPlace(e.target.value);setSelected(null);setOpen(true);setHighlighted(0)}} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onKeyDown={event=>{
          if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);setHighlighted(value=>Math.min(suggestions.length-1,value+1))}
          if(event.key==='ArrowUp'){event.preventDefault();setHighlighted(value=>Math.max(0,value-1))}
          if(event.key==='Enter'&&open&&suggestions[highlighted]){event.preventDefault();choose(suggestions[highlighted])}
          if(event.key==='Escape')setOpen(false)
        }} placeholder="Empieza a escribir tu ciudad" autoComplete="off" required/>
        {open&&place.trim().length>1&&<ul className="locationOptions" id="location-options" role="listbox">{suggestions.length?suggestions.map((location,index)=><li key={`${location.city}-${location.timezone}`}><button type="button" role="option" aria-selected={index===highlighted} className={index===highlighted?'active':''} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(location)}><b>{location.city}</b><span>{location.country}</span></button></li>):<li className="noLocation">Prueba con la ciudad grande más cercana.</li>}</ul>}
        {selected&&<small className="solarHint">{timeUnknown?'Listo: calcularemos tu año, mes y día con la zona histórica de esta ciudad.':'Listo: calcularemos automáticamente su horario histórico y la hora solar real.'}</small>}
      </label>
      {error&&<p className="formError" role="alert">{error}</p>}
      <button className="primary wide" type="submit">Descubrir mi mapa <span>→</span></button>
    </form>
  </main>
}

const STORY_DURATION=15000
function storyCount(chart:Chart|null){return chart?4+profileOrder(chart).length+10:1}
function Stories({chart,step,setStep,onClose,onSave,onFinish}:{chart:Chart;step:number;setStep:(n:number)=>void;onClose:()=>void;onSave:()=>void;onFinish:()=>void}){
  const total=storyCount(chart),identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0],profileKeys=profileOrder(chart),afterPillars=4+profileKeys.length
  const next=()=>step===total-1?onFinish():setStep(Math.min(total-1,step+1)),prev=()=>setStep(Math.max(0,step-1))
  const [paused,setPaused]=useState(false)
  const remaining=useRef(STORY_DURATION),startedAt=useRef(0),pressStartedAt=useRef(0),pressOrigin=useRef({x:0,y:0}),pressMoved=useRef(false)
  useEffect(()=>{remaining.current=STORY_DURATION;setPaused(false)},[step])
  useEffect(()=>{
    if(paused)return
    startedAt.current=performance.now()
    const timer=window.setTimeout(()=>{remaining.current=STORY_DURATION;next()},remaining.current)
    return()=>{window.clearTimeout(timer);remaining.current=Math.max(0,remaining.current-(performance.now()-startedAt.current))}
  },[step,paused])
  const beginPress=(event:ReactPointerEvent<HTMLButtonElement>)=>{pressStartedAt.current=performance.now();pressOrigin.current={x:event.clientX,y:event.clientY};pressMoved.current=false;event.currentTarget.setPointerCapture(event.pointerId);setPaused(true)}
  const movePress=(event:ReactPointerEvent<HTMLButtonElement>)=>{if(Math.hypot(event.clientX-pressOrigin.current.x,event.clientY-pressOrigin.current.y)>12)pressMoved.current=true}
  const endPress=(direction:-1|1,event:ReactPointerEvent<HTMLButtonElement>)=>{const isTap=performance.now()-pressStartedAt.current<350&&!pressMoved.current;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);setPaused(false);if(isTap)(direction===-1?prev:next)()}
  const cancelPress=()=>setPaused(false)
  let content:ReactNode
  if(step===0) content=<LoadingStory/>
  else if(step===1) content=<StoryCenter kicker="ESTE ERES TÚ"><Glyph stem={chart.dayMaster.stem} size={96}/><h1>{identity.name}</h1><p>{identity.caption}</p><Technical>{stems[chart.dayMaster.stem].label} · Día Maestro</Technical></StoryCenter>
  else if(step===2) content=<StoryQuote kicker="TU PERFIL PRINCIPAL" title={identity.headline} body={`${identity.body} ${identity.friction}`}/>
  else if(step===3) content=<StoryQuote kicker={`TU CARTA TIENE ${profileCountLabel(chart).toUpperCase()} VOCES`} title="Tu personalidad cambia de matiz según el espacio." body={chart.birth.timeUnknown?'El año, el mes y el día cuentan cómo te mueves en distintos lugares de tu vida. La hora queda abierta y puede sumarse cuando la conozcas.':'El año, el mes, el día y la hora cuentan cómo te mueves en distintos lugares de tu vida. Juntos forman una imagen mucho más completa que el signo del año que quizá ya conocías.'} extra={<FourDots count={profileKeys.length}/>}/>
  else if(step>=4&&step<afterPillars){const key=profileKeys[step-4],pillar=chart.pillars[key],reading=pillarReading(key,pillar);content=<PillarStory pillarKey={key} chart={chart} title={reading.headline} body={reading.body}/>}
  else if(step===afterPillars) content=<ProfilesStory chart={chart}/>
  else if(step===afterPillars+1) content=<StoryQuote kicker="TUS CINCO RECURSOS" title="Todos tenemos los cinco elementos y recurrimos a cada uno con distinta facilidad." body="El elemento más alto suele aparecer con mayor facilidad. Los elementos más bajos también pueden desarrollarse con práctica. Cada elemento aporta un recurso diferente." extra={<ElementRow chart={chart}/>}/>
  else if(step===afterPillars+2) content=<ElementStory element={strong} label="TU RECURSO MÁS DISPONIBLE" count={chart.elements[strong]} strongest/>
  else if(step===afterPillars+3) content=<ElementStory element={low} label="EL QUE PIDE MÁS INTENCIÓN" count={chart.elements[low]}/>
  else if(step===afterPillars+4) content=<ElementsStory chart={chart}/>
  else if(step===afterPillars+5) content=<ActionsStory chart={chart}/>
  else if(step===afterPillars+6) content=<InteractionsStory chart={chart}/>
  else if(step===afterPillars+7) content=<StoryQuote kicker="HAY UN ESPACIO EN BLANCO" title="El vacío señala lo que construyes a tu manera." body="En BaZi, un vacío marca una parte de la vida que pide experiencia propia, prueba y una definición menos heredada." extra={<span className="voidRing" aria-hidden="true"/>}/>
  else if(step===afterPillars+8){
    const copy=voidReading(chart)
    content=<StoryQuote kicker="ASÍ APARECE EN TU MAPA" title={copy.title} body={copy.body} extra={<Technical>{chart.voidBranches.map(x=>branches[x].label).join(' · ')}</Technical>}/>
  }
  else content=<FinalStory chart={chart}/>
  return <main className={`storyShell${paused?' storyPaused':''}`}>
    <div className="progress" aria-label={`Historia ${step+1} de ${total}`}>{Array.from({length:total},(_,i)=><i key={i} className={i<step?'done':i===step?'active':''}/>)}</div>
    <Brand/><button className="storyClose" onClick={onClose} aria-label="Saltar historias y abrir la lectura completa">×</button>
    <section className={`story story-${step}`} key={step}>{content}</section>
    <div className="storyTapZones"><button type="button" aria-label="Historia anterior" onPointerDown={beginPress} onPointerMove={movePress} onPointerUp={event=>endPress(-1,event)} onPointerCancel={cancelPress} onContextMenu={event=>event.preventDefault()}/><button type="button" aria-label="Historia siguiente" onPointerDown={beginPress} onPointerMove={movePress} onPointerUp={event=>endPress(1,event)} onPointerCancel={cancelPress} onContextMenu={event=>event.preventDefault()}/></div>
    <div className="storyNav"><button onClick={prev} disabled={step===0} aria-label="Historia anterior">←</button><div><button className="later" onClick={onSave}>Verlo más tarde</button><button className="next" onClick={next}>{step===total-1?'Quiero saber más':'Continuar'} <span>→</span></button></div></div>
  </main>
}

function LoadingStory(){return <StoryCenter kicker="UNA TRADICIÓN DE MÁS DE MIL AÑOS"><div className="loader"><i/><i/><i/><span>十</span></div><h2>Ordenando tu mapa</h2><p>Estamos ubicando los ritmos del año, mes, día y hora en que naciste.</p></StoryCenter>}
function StoryCenter({kicker,children}:{kicker:string;children:ReactNode}){return <div className="storyCenter"><p className="eyebrow">{kicker}</p>{children}</div>}
function StoryQuote({kicker,title,body,extra}:{kicker:string;title:string;body:string;extra?:ReactNode}){return <div className="storyCopy"><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{body}</p>{extra}</div>}
function Technical({children}:{children:ReactNode}){return <small className="technical">DATO TÉCNICO · {children}</small>}
function FourDots({count=4}:{count?:number}){return <div className="fourDots" aria-hidden="true">{Array.from({length:count},(_,index)=><i key={index}/>)}</div>}

function PillarStory({pillarKey,chart,title,body}:{pillarKey:PillarKey;chart:Chart;title:string;body:string}){
  const pillar=chart.pillars[pillarKey],meta=pillarMeta[pillarKey],identity=identityMeta[pillar.stem]
  return <div className="pillarStory"><p className="eyebrow">{meta.eyebrow.toUpperCase()}</p><div className="pillarHero"><Glyph stem={pillar.stem} size={80}/><div><small>{meta.title}</small><h2>{identity.name}</h2><em>{branches[pillar.branch].label}</em></div></div><h3>{title}</h3><p>{body}</p><Technical>{pillarLabel(pillar)}</Technical></div>
}
function MiniProfile({pillarKey,chart}:{pillarKey:PillarKey;chart:Chart}){const p=chart.pillars[pillarKey],i=identityMeta[p.stem];return <div className="miniProfile"><Glyph stem={p.stem} size={40}/><small>{pillarMeta[pillarKey].eyebrow}</small><b>{i.name}</b><span>{branches[p.branch].label}</span></div>}
function ProfilesStory({chart}:{chart:Chart}){return <div className="profilesStory"><p className="eyebrow">TUS {profileCountLabel(chart).toUpperCase()} PERFILES</p><h2>Distintos espacios.<br/>La misma persona.</h2><div className={`profilesGrid profiles-${profileOrder(chart).length}`}>{profileOrder(chart).map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><p>{profileSummary(chart)}</p><ShareActions kind="profiles" chart={chart} shareLabel="Compartir mis perfiles"/></div>}
function ElementRow({chart}:{chart:Chart}){const max=Math.max(...Object.values(chart.elements));return <div className="elementRow">{ELEMENT_ORDER.map(element=><div key={element}><ElementMark element={element}/><i style={{height:`${28+chart.elements[element]/max*72}px`}}/><small>{elementMeta[element].label}</small></div>)}</div>}
function ElementStory({element,label,strongest=false}:{element:ElementKey;label:string;count:number;strongest?:boolean}){const meta=elementMeta[element];return <StoryCenter kicker={label}><ElementMark element={element}/><h1>{meta.label}</h1><p>{strongest?`${meta.sentence} Es una respuesta a la que vuelves con facilidad.`:`${meta.sentence} Este recurso gana presencia cuando lo eliges y lo practicas de forma consciente.`}</p><Technical>{strongest?'Es el recurso que más se repite':'Es el recurso que menos se repite'}</Technical></StoryCenter>}
function ElementsStory({chart}:{chart:Chart}){return <div className="elementsStory"><p className="eyebrow">TU MEZCLA, DE UN VISTAZO</p><h2>Tus cinco elementos muestran los recursos que usas con mayor facilidad.</h2><ElementRow chart={chart}/><p>El elemento que tienes más alto lo puedes utilizar de forma más sencilla. Los elementos que tienes más bajos también los puedes trabajar. Ningún elemento es mejor que otro.</p><ShareActions kind="elements" chart={chart} shareLabel="Compartir mi gráfica"/></div>}

function topActions(chart:Chart){return (Object.entries(chart.tenGods) as [TenGodKey,number][]).sort((a,b)=>b[1]-a[1]).slice(0,3)}
function ActionsStory({chart}:{chart:Chart}){const labels=['Tu respuesta más automática','También muy disponible','Otro recurso cercano'];return <div className="actionsStory"><p className="eyebrow">TUS FORMAS DE ACTUAR</p><h2>Cuando algo importa,<br/>estas respuestas aparecen primero.</h2><div className="actionList">{topActions(chart).map(([key],i)=><article key={key}><span aria-hidden="true">→</span><div><small>{labels[i]}</small><b>{actionMeta[key].name}</b><p>{actionMeta[key].copy}</p></div></article>)}</div><ShareActions kind="actions" chart={chart} shareLabel="Compartir mis formas de actuar"/></div>}
function InteractionsStory({chart}:{chart:Chart}){const data=chart.interactions[0]?interactionReading(chart.interactions[0]):{title:`Tus ${profileCountLabel(chart)} ritmos avanzan con bastante independencia`,body:'Tus ramas natales dejan espacio para que cada área responda con su propio ritmo. Las etapas y las fechas futuras pueden activar encuentros distintos.'};return <div className="interactionStory"><p className="eyebrow">LO QUE PASA CUANDO TUS PARTES SE ENCUENTRAN</p><h2>{data.title}</h2><p>{data.body}</p>{chart.interactions[0]&&<Technical>{chart.interactions[0].kind} · {chart.interactions[0].note}</Technical>}<div className="orbit" aria-hidden="true"><i/><i/><span>十</span></div></div>}
function FinalStory({chart}:{chart:Chart}){const identity=identityMeta[chart.dayMaster.stem],voidCopy=voidReading(chart);return <div className="finalStory"><p className="eyebrow">ESTE ERES TÚ</p><div className="finalCard"><Glyph stem={chart.dayMaster.stem} size={74}/><small>TU MAPA EN UNA IMAGEN</small><h2>{identity.name}</h2><p>{identity.headline}</p><div className={`finalProfiles profiles-${profileOrder(chart).length}`}>{profileOrder(chart).map(key=><MiniProfile key={key} pillarKey={key} chart={chart}/>)}</div><span>{voidCopy.title}</span></div><ShareActions kind="summary" chart={chart} shareLabel="Compartir mi mapa"/></div>}

async function saveLater(input:BirthInput,step:number,notify:(x:string)=>void){
  const url=makeUrl(input,step)
  window.history.replaceState({},'',url)
  try{await navigator.clipboard.writeText(url);notify('Enlace copiado. Puedes volver exactamente a esta parte.')}catch{notify('Listo. La dirección de esta página ya guarda tu avance.')}
}

function ShareActions({kind,chart,shareLabel}:{kind:ShareKind;chart:Chart;shareLabel:string}){return <div className="shareActions"><ShareButton kind={kind} chart={chart}>{shareLabel}</ShareButton><ShareButton kind={kind} chart={chart} downloadOnly>Descargar</ShareButton></div>}
function ShareButton({kind,chart,children,downloadOnly=false,date}:{kind:ShareKind;chart:Chart;children:ReactNode;downloadOnly?:boolean;date?:string}){
  const [busy,setBusy]=useState(false)
  const act=async()=>{setBusy(true);try{await shareImage(chart,kind,downloadOnly,date)}finally{setBusy(false)}}
  return <button className={`shareButton ${downloadOnly?'downloadButton':''}`} onClick={act} disabled={busy}>{busy?(downloadOnly?'Descargando…':'Preparando imagen…'):children} <span>{downloadOnly?'↓':'↗'}</span></button>
}

async function shareImage(chart:Chart,kind:ShareKind,downloadOnly=false,date?:string){
  await document.fonts?.ready
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
  const ctx=canvas.getContext('2d')!,meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem]
  const daily=kind==='today'?dayReading(chart,date||todayInZone(chart.birth.timezone)):null
  drawPosterBase(ctx,meta)
  if(kind==='today'&&daily)drawTodayPoster(ctx,chart,daily)
  else if(kind==='identity')drawIdentityPoster(ctx,chart)
  else if(kind==='profiles')drawProfilesPoster(ctx,chart)
  else if(kind==='elements')drawElementsPoster(ctx,chart)
  else if(kind==='actions')drawActionsPoster(ctx,chart)
  else drawSummaryPoster(ctx,chart)
  drawPosterFooter(ctx,meta.dark)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('La imagen tardó demasiado en generarse')),'image/png'))
  const file=new File([blob],`mi-mapa-${kind}.png`,{type:'image/png'})
  const localPreview=['127.0.0.1','localhost'].includes(location.hostname)
  if(!downloadOnly&&!localPreview&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Mi Mapa',text:'Este es mi mapa BaZi, explicado en palabras cotidianas.'});return}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
const posterAnimalPaths:Record<keyof typeof branches,string>={
  rat:'M6.8 9a2.2 2.2 0 1 0 4.4 0M12.8 9a2.2 2.2 0 1 0 4.4 0M8 10.5c1-2 7-2 8 0 1 2 .5 5-4 7-4.5-2-5-5-4-7zM12 13v1M6 13h3M15 13h3',
  ox:'M8 9C6 8 5 6 5 4c3 0 5 1 6 3M16 9c2-1 3-3 3-5-3 0-5 1-6 3M8 9c1-2 7-2 8 0v6c-1 3-7 3-8 0V9zM10 14h4',
  tiger:'M7 8 5 5l4 1M17 8l2-3-4 1M7 8c1-2 9-2 10 0v7c-2 3-8 3-10 0V8zM9 10h6M10 12h4M12 9v6',
  rabbit:'M9 9C7 6 7 2 9 2c2 0 2 4 2 7M15 9c2-3 2-7 0-7-2 0-2 4-2 7M8 10c1-2 7-2 8 0v5c-1 3-7 3-8 0v-5zM10 13h.1M14 13h.1',
  dragon:'M5 15c2-5 4-7 8-7 3 0 5 2 6 4-2-1-4 0-5 2-2 3-6 4-9 1zM10 8 8 5M14 8l2-3M17 11l2-1',
  snake:'M8 6c4-3 8-1 8 2 0 4-8 3-8 7 0 3 5 4 8 1M16 8h.1',
  horse:'M8 18V9l3-5 5 3v8c-1 3-5 4-8 3zM11 8h5M13 10h.1M8 11 5 9',
  goat:'M8 9C6 7 6 4 7 3c2 1 3 3 3 5M16 9c2-2 2-5 1-6-2 1-3 3-3 5M8 9c1-2 7-2 8 0v6c-2 3-6 3-8 0V9zM10 13h4',
  monkey:'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12M5.5 10a2 2 0 1 0 0 4M18.5 10a2 2 0 1 1 0 4M9 11c1-2 5-2 6 0v4c-1 2-5 2-6 0v-4zM10 14h4',
  rooster:'M9 18V8c2-3 6-3 8 0v6c-1 3-5 5-8 4zM11 6c0-2 2-3 3-1 1-2 3-1 3 1M17 9l3 2-3 1M7 10 4 8M7 13 4 14',
  dog:'M8 8 5 5v6M16 8l3-3v6M8 8c1-2 7-2 8 0v7c-1 3-7 3-8 0V8zM10 12h.1M14 12h.1M10 15h4',
  pig:'M7 9C8 6 16 6 17 9v6c-2 3-8 3-10 0V9zM8 8 6 5l4 2M16 8l2-3-4 2M9 13c1-2 5-2 6 0v2c-1 2-5 2-6 0v-2zM11 14h.1M13 14h.1',
}
const elementStem:Record<ElementKey,StemKey>={wood:'yi',fire:'ding',earth:'wu',metal:'xin',water:'ren'}
function posterFont(size:number,weight=600,serif=false,italic=false){return `${italic?'italic ':''}${weight} ${size}px ${serif?'Georgia, serif':'Arial, sans-serif'}`}
function fitPosterText(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,maxSize:number,minSize:number,weight=700,serif=true,italic=false){let size=maxSize;while(size>minSize){ctx.font=posterFont(size,weight,serif,italic);if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size}
function posterLines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,maxLines=4){const words=text.split(/\s+/),lines:string[]=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines-1)break}else line=test}if(line&&lines.length<maxLines)lines.push(line);const consumed=lines.join(' ').split(/\s+/).length;if(consumed<words.length)lines[lines.length-1]=`${lines[lines.length-1].replace(/[.,;:]?$/,'')}…`;return lines}
function drawPosterText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines=4,align:CanvasTextAlign='left'){ctx.textAlign=align;const lines=posterLines(ctx,text,maxWidth,maxLines);lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));return y+lines.length*lineHeight}
function drawPosterBase(ctx:CanvasRenderingContext2D,meta:(typeof elementMeta)[ElementKey]){const gradient=ctx.createLinearGradient(0,0,1080,1350);gradient.addColorStop(0,'#f9f4eb');gradient.addColorStop(.52,meta.soft);gradient.addColorStop(1,'#edddd3');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1350);ctx.globalAlpha=.12;for(let i=0;i<7;i++){ctx.fillStyle=i%2?meta.color:'#fff';ctx.beginPath();ctx.arc((i*239+70)%1080,(i*317+110)%1350,135+(i%3)*70,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,.76)';roundRect(ctx,46,46,988,1258,62);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(20,800);ctx.fillText('十  MI MAPA',88,100);ctx.textAlign='right';ctx.font=posterFont(15,700);ctx.fillText('ESTE ERES TÚ',992,98)}
function drawPosterFooter(ctx:CanvasRenderingContext2D,color:string){ctx.strokeStyle='rgba(60,50,42,.14)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(88,1208);ctx.lineTo(992,1208);ctx.stroke();ctx.fillStyle=color;ctx.textAlign='left';ctx.font=posterFont(17,800);ctx.fillText('DESCUBRE EL TUYO',88,1252);ctx.font=posterFont(16,500);ctx.fillText('ebermed.github.io/mi-mapa',88,1278);ctx.textAlign='right';ctx.font=posterFont(36,400);ctx.fillText('↗',990,1268)}
function drawLineIcon(ctx:CanvasRenderingContext2D,path:string,x:number,y:number,size:number,color:string,lineWidth=4){const scale=size/24;ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(scale,scale);ctx.strokeStyle=color;ctx.fillStyle='transparent';ctx.lineWidth=lineWidth/scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(path));ctx.restore()}
function drawStemPosterIcon(ctx:CanvasRenderingContext2D,stem:StemKey,x:number,y:number,size:number,color:string){drawLineIcon(ctx,iconPaths[stem],x,y,size,color,Math.max(3,size/25))}
function drawAnimalPosterIcon(ctx:CanvasRenderingContext2D,branch:keyof typeof branches,x:number,y:number,size:number,color:string){drawLineIcon(ctx,posterAnimalPaths[branch],x,y,size,color,Math.max(3,size/24))}
function drawSeal(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,fill:string){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=fill;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,radius-1,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawProfilePosterCard(ctx:CanvasRenderingContext2D,chart:Chart,key:PillarKey,x:number,y:number,w:number,h:number){const pillar=chart.pillars[key],color=elementMeta[stems[pillar.stem].element].dark;ctx.fillStyle='rgba(255,255,255,.72)';roundRect(ctx,x,y,w,h,28);ctx.fill();ctx.strokeStyle='rgba(60,50,42,.1)';ctx.stroke();drawStemPosterIcon(ctx,pillar.stem,x+70,y+h/2,64,color);drawAnimalPosterIcon(ctx,pillar.branch,x+w-56,y+54,44,color);ctx.fillStyle='#3e3832';ctx.textAlign='left';ctx.font=posterFont(14,800);ctx.fillText(pillarMeta[key].eyebrow.toUpperCase(),x+125,y+44);ctx.font=posterFont(34,700,true);ctx.fillText(identityMeta[pillar.stem].name,x+125,y+88);ctx.font=posterFont(17,500);ctx.fillText(branches[pillar.branch].label,x+125,y+120);ctx.font=posterFont(14,600);ctx.fillStyle=color;ctx.fillText(pillarMeta[key].title.toUpperCase(),x+125,y+150)}
function drawIdentityPoster(ctx:CanvasRenderingContext2D,chart:Chart){const meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem],polarity=chart.dayMaster.polarity==='yin'?'Yin':'Yang';ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font=posterFont(17,800);ctx.fillText('MI DÍA MAESTRO',540,162);drawSeal(ctx,540,360,156,meta.color);drawStemPosterIcon(ctx,chart.dayMaster.stem,540,360,196,meta.dark);ctx.font=posterFont(fitPosterText(ctx,identity.name,820,118,72),760,true);ctx.fillText(identity.name,540,630);ctx.font=posterFont(31,520,true);drawPosterText(ctx,identity.headline,540,700,820,42,3,'center');ctx.fillStyle='rgba(255,255,255,.76)';roundRect(ctx,156,875,768,178,34);ctx.fill();ctx.strokeStyle='rgba(60,50,42,.1)';ctx.stroke();ctx.fillStyle=meta.dark;ctx.font=posterFont(14,800);ctx.fillText('ASÍ SE ENCUENTRA EN MI CARTA',540,925);ctx.font=posterFont(38,700,true);ctx.fillText(`${meta.label} ${polarity} · ${chart.dayMaster.strength}`,540,985);ctx.font=posterFont(20,500);ctx.fillText('Mi centro: la forma en que vuelvo a mí para decidir.',540,1025)}
function drawProfilesPoster(ctx:CanvasRenderingContext2D,chart:Chart){
  const meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem],keys=profileOrder(chart),heading=`MIS ${profileCountLabel(chart).toUpperCase()} PERFILES`
  ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(16,800);ctx.fillText(heading,88,158)
  drawSeal(ctx,182,292,78,meta.color);drawStemPosterIcon(ctx,chart.dayMaster.stem,182,292,96,meta.dark)
  ctx.font=posterFont(fitPosterText(ctx,identity.name,650,78,50),720,true);ctx.fillText(identity.name,300,285)
  ctx.font=posterFont(23,500,true);drawPosterText(ctx,identity.headline,300,330,650,31,3)
  keys.forEach((key,index)=>drawProfilePosterCard(ctx,chart,key,keys.length===3&&index===2?320:index%2?552:88,index<2?470:715,440,215))
}
function drawElementPosterSeal(ctx:CanvasRenderingContext2D,element:ElementKey,value:number,max:number,x:number,y:number){const color=elementMeta[element].color,r=64+value/max*25;ctx.strokeStyle='rgba(60,50,42,.12)';ctx.lineWidth=10;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=color;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(.18+.82*value/max));ctx.stroke();drawStemPosterIcon(ctx,elementStem[element],x,y,72,elementMeta[element].dark);ctx.fillStyle=elementMeta[element].dark;ctx.textAlign='center';ctx.font=posterFont(15,800);ctx.fillText(elementMeta[element].label.toUpperCase(),x,y+r+32)}
function drawElementsPoster(ctx:CanvasRenderingContext2D,chart:Chart){
  const meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],max=Math.max(...Object.values(chart.elements))
  ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font=posterFont(17,800);ctx.fillText(`${identity.name.toUpperCase()} · MIS RECURSOS`,540,162)
  ctx.font=posterFont(fitPosterText(ctx,'MIS CINCO ELEMENTOS',870,68,42),760,true);ctx.fillText('MIS CINCO ELEMENTOS',540,240)
  const positions=[[180,430],[540,390],[900,430],[350,650],[730,650]];ELEMENT_ORDER.forEach((element,index)=>drawElementPosterSeal(ctx,element,chart.elements[element],max,positions[index][0],positions[index][1]))
  ctx.fillStyle='rgba(255,255,255,.76)';roundRect(ctx,90,805,900,300,36);ctx.fill()
  drawStemPosterIcon(ctx,elementStem[strong],195,920,100,elementMeta[strong].dark)
  ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(15,800);ctx.fillText('ASÍ SE NOTA EN TI',285,860)
  ctx.font=posterFont(44,700,true);ctx.fillText(elementMeta[strong].label,285,920)
  ctx.font=posterFont(25,500,true);drawPosterText(ctx,elementPortrait[strong],285,970,620,34,4)
}
function drawActionCard(ctx:CanvasRenderingContext2D,chart:Chart,key:TenGodKey,index:number,x:number,y:number,w:number,h:number,feature=false){const meta=elementMeta[chart.dayMaster.element];ctx.fillStyle=feature?'rgba(255,255,255,.82)':'rgba(255,255,255,.66)';roundRect(ctx,x,y,w,h,34);ctx.fill();ctx.strokeStyle='rgba(60,50,42,.1)';ctx.stroke();ctx.fillStyle=meta.color;ctx.beginPath();ctx.arc(x+58,y+60,30,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=posterFont(17,800);ctx.fillText(`0${index+1}`,x+58,y+67);ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(feature?43:31,700,true);drawPosterText(ctx,actionMeta[key].name,x+105,y+63,w-145,feature?48:38,2);ctx.font=posterFont(feature?23:19,500);drawPosterText(ctx,actionMeta[key].copy,x+48,y+(feature?145:120),w-96,feature?32:27,feature?4:5)}
function drawActionsPoster(ctx:CanvasRenderingContext2D,chart:Chart){const meta=elementMeta[chart.dayMaster.element],actions=topActions(chart);ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(16,800);ctx.fillText('CUANDO ALGO IMPORTA',88,164);ctx.font=posterFont(64,760,true);drawPosterText(ctx,'ASÍ SUELO RESPONDER',88,238,720,68,2);drawSeal(ctx,890,225,100,meta.color);drawStemPosterIcon(ctx,chart.dayMaster.stem,890,225,120,meta.dark);drawActionCard(ctx,chart,actions[0][0],0,88,370,904,300,true);drawActionCard(ctx,chart,actions[1][0],1,88,700,436,360);drawActionCard(ctx,chart,actions[2][0],2,556,700,436,360)}
function drawTodayPoster(ctx:CanvasRenderingContext2D,chart:Chart,daily:ReturnType<typeof dayReading>){
  const meta=elementMeta[chart.dayMaster.element]
  ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(16,800);ctx.fillText(formatLongDate(daily.date).toUpperCase(),88,156)
  ctx.font=posterFont(21,650,true);ctx.fillText('HOY ES UN DÍA PARA',88,208)
  ctx.font=posterFont(fitPosterText(ctx,daily.rhythm.toUpperCase(),640,88,52),780,true);ctx.fillText(daily.rhythm.toUpperCase(),88,298)
  drawSeal(ctx,850,248,112,meta.color);drawAnimalPosterIcon(ctx,daily.pillar.branch,850,248,136,meta.dark)
  ctx.strokeStyle='rgba(60,50,42,.12)';ctx.beginPath();ctx.moveTo(88,360);ctx.lineTo(992,360);ctx.stroke()
  ctx.font=posterFont(26,560,true);drawPosterText(ctx,`${daily.body} ${daily.personal}`,88,420,890,36,4)
  ctx.fillStyle='rgba(255,255,255,.56)';roundRect(ctx,88,610,904,505,36);ctx.fill()
  ctx.fillStyle=meta.dark;ctx.font=posterFont(15,800);ctx.fillText('TRES COSAS QUE PUEDEN FLUIR MEJOR',128,664)
  daily.opportunity.forEach((item,index)=>{
    const y=698+index*128;ctx.fillStyle='rgba(255,255,255,.82)';roundRect(ctx,120,y,840,104,24);ctx.fill()
    ctx.fillStyle=meta.color;ctx.textAlign='center';ctx.font=posterFont(24,800,true);ctx.fillText(String(index+1).padStart(2,'0'),166,y+63)
    ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(26,650);ctx.fillText(item.charAt(0).toUpperCase()+item.slice(1),220,y+63)
  })
}
function drawSummaryPoster(ctx:CanvasRenderingContext2D,chart:Chart){const meta=elementMeta[chart.dayMaster.element],identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0],keys=profileOrder(chart),cardWidth=keys.length===3?280:208,gap=keys.length===3?32:22;ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font=posterFont(16,800);ctx.fillText('MI PERFIL PRINCIPAL',540,155);drawSeal(ctx,540,305,112,meta.color);drawStemPosterIcon(ctx,chart.dayMaster.stem,540,305,138,meta.dark);ctx.font=posterFont(fitPosterText(ctx,identity.name,770,94,60),760,true);ctx.fillText(identity.name,540,500);ctx.font=posterFont(28,500,true);drawPosterText(ctx,identity.headline,540,555,810,37,3,'center');[['MI RECURSO MÁS DISPONIBLE',strong],['EL QUE PUEDO TRABAJAR MÁS',low]].forEach(([label,element],index)=>{const key=element as ElementKey,x=index?552:88;ctx.fillStyle='rgba(255,255,255,.7)';roundRect(ctx,x,690,440,205,30);ctx.fill();drawStemPosterIcon(ctx,elementStem[key],x+74,792,84,elementMeta[key].dark);ctx.fillStyle=meta.dark;ctx.textAlign='left';ctx.font=posterFont(13,800);ctx.fillText(String(label),x+135,746);ctx.font=posterFont(37,700,true);ctx.fillText(elementMeta[key].label,x+135,805);ctx.font=posterFont(16,500);drawPosterText(ctx,elementMeta[key].sentence,x+135,838,260,23,2)});keys.forEach((key,index)=>{const p=chart.pillars[key],x=88+index*(cardWidth+gap);ctx.fillStyle='rgba(255,255,255,.62)';roundRect(ctx,x,935,cardWidth,190,24);ctx.fill();drawStemPosterIcon(ctx,p.stem,x+cardWidth*.28,998,54,elementMeta[stems[p.stem].element].dark);drawAnimalPosterIcon(ctx,p.branch,x+cardWidth*.76,990,38,elementMeta[branches[p.branch].element].dark);ctx.fillStyle=meta.dark;ctx.textAlign='center';ctx.font=posterFont(12,800);ctx.fillText(pillarMeta[key].eyebrow.toUpperCase(),x+cardWidth/2,1058);ctx.font=posterFont(26,700,true);ctx.fillText(identityMeta[p.stem].name,x+cardWidth/2,1094)})}

function Reading({chart,onHome,onReplay,onTool}:{chart:Chart;onHome:()=>void;onReplay:()=>void;onTool:(view:View)=>void}){
  const identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0],voidCopy=voidReading(chart)
  return <main className="reading">
    <header className="readingTop"><button onClick={onHome}>← Tus cartas</button><Brand onNavigate={target=>target==='home'?onHome():target==='reading'?window.scrollTo({top:0,behavior:'smooth'}):onTool(target)}/><button onClick={onReplay}>Ver historias</button></header>
    <section className="readingHero"><div><p className="eyebrow">ESTE ERES TÚ</p><h1>{identity.name}</h1><p>{identity.headline}</p><div className="heroActions"><Technical>{stems[chart.dayMaster.stem].label} · {chart.dayMaster.strength}</Technical><ShareButton kind="identity" chart={chart} downloadOnly>Descargar mi perfil</ShareButton></div></div><Glyph stem={chart.dayMaster.stem} size={160}/></section>
    <section className="readingSection introReading"><p>{identity.body}</p><p>{identity.friction}</p></section>
    <div className="readingBody">
      <aside className="readingRail"><p>EXPLORA TU MAPA</p><nav aria-label="Secciones de tu lectura">
        <a href="#perfiles"><i/>Tus {profileCountLabel(chart)} perfiles<small>Cómo cambias según el espacio</small></a>
        <a href="#elementos"><i/>Tus elementos<small>Recursos fáciles y conscientes</small></a>
        <a href="#acciones"><i/>Cómo actúas<small>Lo que aparece primero</small></a>
        <a href="#encuentros"><i/>Encuentros<small>Choques y armonías internas</small></a>
        <a href="#vacio"><i/>Tu vacío<small>Lo que construyes a tu manera</small></a>
        <a href="#ahora"><i/>Tu momento actual<small>Hoy, calendario, mes y ciclo</small></a>
        <a href="#carta-completa"><i/>Carta completa<small>La estructura para ojos expertos</small></a>
      </nav></aside>
      <div className="readingContent">
        <section className="readingSection" id="perfiles"><SectionHead kicker={`TUS ${profileCountLabel(chart).toUpperCase()} PERFILES`} title="Quién eres cambia de matiz según el espacio."/><div className="longProfiles">{profileOrder(chart).map(key=>{const p=chart.pillars[key],r=pillarReading(key,p);return <article key={key}><div><Glyph stem={p.stem} size={58}/><span><small>{pillarMeta[key].eyebrow}</small><h3>{identityMeta[p.stem].name}</h3><em>{pillarMeta[key].title}</em></span></div><p>{r.body}</p><Technical>{pillarLabel(p)}</Technical></article>})}</div><ShareActions kind="profiles" chart={chart} shareLabel="Compartir mis perfiles"/></section>
        <section className="readingSection" id="elementos"><SectionHead kicker="TU MEZCLA" title="Cinco maneras de responder a la vida."/><div className="elementFeature"><div><small>MÁS DISPONIBLE</small><ElementMark element={strong}/><h3>{elementMeta[strong].label}</h3><p>{elementMeta[strong].sentence}</p></div><div><small>PIDE MÁS INTENCIÓN</small><ElementMark element={low}/><h3>{elementMeta[low].label}</h3><p>{elementMeta[low].sentence}</p></div></div><ElementRow chart={chart}/><ShareActions kind="elements" chart={chart} shareLabel="Compartir mi gráfica"/></section>
        <section className="readingSection" id="acciones"><SectionHead kicker="CÓMO ACTÚAS" title="Las respuestas que tienes más a la mano."/><div className="longActions">{topActions(chart).map(([key],index)=><article key={key}><span aria-hidden="true">→</span><div><small>{index===0?'APARECE PRIMERO':index===1?'TAMBIÉN MUY DISPONIBLE':'OTRO RECURSO CERCANO'}</small><h3>{actionMeta[key].name}</h3><p>{actionMeta[key].copy}</p></div></article>)}</div></section>
        <section className="readingSection" id="encuentros"><SectionHead kicker="CHOQUES Y ARMONÍAS" title="Lo que pasa cuando tus partes se encuentran."/><div className="interactionGrid">{chart.interactions.length?chart.interactions.map(item=>{const r=interactionReading(item);return <article key={item.id}><small>{item.kind}</small><h3>{r.title}</h3><p>{r.body}</p><Technical>{item.note}</Technical></article>}):<article><h3>Cada área conserva su propio ritmo.</h3><p>Tus {profileCountLabel(chart)} ramas dejan espacio para que cada área responda de forma independiente. Las etapas y fechas futuras pueden activar relaciones nuevas.</p></article>}</div></section>
        <section className="readingSection" id="vacio"><SectionHead kicker="TU VACÍO" title={voidCopy.title}/><div className="voidLong"><span className="voidRing"/><p>{voidCopy.body}</p></div></section>
        <section className="readingSection" id="palacios"><SectionHead kicker="TUS PALACIOS" title={`${profileCountLabel(chart).charAt(0).toUpperCase()+profileCountLabel(chart).slice(1)} áreas donde se expresa tu carta.`}/><div className="palaces">{profileOrder(chart).map(key=><article key={key}><small>{pillarMeta[key].eyebrow}</small><h3>{pillarMeta[key].title}</h3><p>{pillarMeta[key].intro}</p></article>)}</div></section>
        <TemporalStrip chart={chart} onTool={onTool}/>
        <ExpertChart chart={chart}/>
        <section className="readingSection downloads"><SectionHead kicker="PARA GUARDAR" title="Descarga cualquiera de tus imágenes."/><div><ShareButton kind="identity" chart={chart} downloadOnly>Día Maestro</ShareButton><ShareButton kind="summary" chart={chart} downloadOnly>Resumen completo</ShareButton><ShareButton kind="profiles" chart={chart} downloadOnly>{chart.birth.timeUnknown?'Tres perfiles':'Cuatro perfiles'}</ShareButton><ShareButton kind="elements" chart={chart} downloadOnly>Gráfica de elementos</ShareButton></div></section>
      </div>
    </div>
    <footer><Brand/><p>BaZi por dentro. Palabras de todos los días por fuera.</p><button onClick={onHome}>Volver a mis cartas</button></footer>
  </main>
}
function ExpertChart({chart}:{chart:Chart}){
  const order:TechnicalPillarKey[]=chart.birth.timeUnknown?['year','month','day','conception','life']:['year','month','day','hour','conception','life']
  const [pick,setPick]=useState<{pillar:TechnicalPillarKey;kind:'stem'|'branch'|'hidden'|'void';stem?:StemKey}>({pillar:'day',kind:'stem'})
  const chartRef=useRef<HTMLDivElement|null>(null)
  const slide=(direction:-1|1)=>chartRef.current?.scrollBy({left:direction*Math.min(window.innerWidth*.82,360),behavior:'smooth'})
  const pillarFor=(key:TechnicalPillarKey):Pillar|undefined=>key==='life'||key==='conception'?chart.auxiliaryPillars[key]:chart.pillars[key]
  const metaFor=(key:TechnicalPillarKey)=>key==='life'||key==='conception'?auxiliaryMeta[key]:pillarMeta[key]
  const pillar=pillarFor(pick.pillar)||chart.pillars.day
  const selectedStem=pick.kind==='hidden'?pick.stem!:pillar.stem
  const voidCopy=voidReading(chart)
  const detail=pick.kind==='void'
    ?{title:voidCopy.title,body:voidCopy.body,technical:`Vacío · ${chart.voidBranches.map(branch=>branches[branch].label).join(' · ')}`}
    :pick.kind==='branch'
    ?{title:`${branches[pillar.branch].label}: tu ritmo de fondo`,body:branchPace[pillar.branch],technical:`Rama terrestre · ${elementMeta[branches[pillar.branch].element].label}`}
    :pick.kind==='hidden'
      ?{title:`${identityMeta[selectedStem].name} trabaja desde el fondo`,body:`Esta parte suele aparecer después de conocerte mejor. Funciona como un recurso interno: ${identityMeta[selectedStem].body.charAt(0).toLowerCase()+identityMeta[selectedStem].body.slice(1)}`,technical:`Energía de fondo · ${stems[selectedStem].label}`}
      :{title:identityMeta[selectedStem].headline,body:identityMeta[selectedStem].body,technical:`Tallo celestial ${stems[selectedStem].han} · ${stems[selectedStem].label}`}
  const explanation=(className:string)=><aside className={`expertExplanation ${className}`} aria-live="polite">{pick.kind==='void'?<span className="voidGlyph">○</span>:pick.kind==='branch'?<AnimalGlyph branch={pillar.branch} size={52}/>:<Glyph stem={selectedStem} size={52}/>}<div><small>{metaFor(pick.pillar).eyebrow} · {pick.kind==='stem'?'lo visible':pick.kind==='branch'?'la base':pick.kind==='hidden'?'lo que opera detrás':'lo que desarrollas a tu manera'}</small><h3>{detail.title}</h3><p>{detail.body}</p><Technical>{detail.technical}</Technical></div></aside>
  const correction=Math.round(chart.birth.solarCorrectionMinutes)
  return <section className="readingSection expertSection" id="carta-completa">
    <SectionHead kicker="TU CARTA COMPLETA" title="La estructura técnica, traducida para que sí se pueda leer."/>
    <p className="expertIntro">Esta es la carta que vería una persona experta. Toca cualquier símbolo para entender qué representa sin tener que aprenderte primero toda la nomenclatura.</p>
    {chart.birth.timeUnknown?<div className="solarReceipt unknownHourReceipt"><span>HORA DE NACIMIENTO<b>ABIERTA</b></span><i>○</i><span>PILARES CALCULADOS<b>AÑO · MES · DÍA</b></span><small>La hora puede agregarse después para completar el cuarto pilar.</small></div>:<div className="solarReceipt"><span>HORA QUE ESCRIBISTE<b>{chart.birth.time}</b></span><i>→</i><span>HORA SOLAR USADA<b>{chart.birth.calculationTime}</b></span><small>{correction>=0?'+':''}{correction} min · horario histórico calculado automáticamente en {chart.birth.place}</small></div>}
    <div className="expertCarousel"><button type="button" className="expertCarouselArrow expertCarouselPrev" onClick={()=>slide(-1)} aria-label="Ver pilar anterior">←</button><div ref={chartRef} className={`expertChart expertChart-${order.length}`} role="group" aria-label="Tus pilares natales y auxiliares">{order.map(key=>{const item=pillarFor(key),meta=metaFor(key);return <div className="expertPillar" key={key}>{item?<article className={key==='day'?'dayColumn':''}>
      <header><small>{meta.eyebrow}</small><b>{meta.title}</b>{key==='day'&&<em>TU CENTRO</em>}{(key==='life'||key==='conception')&&<em>AUXILIAR</em>}</header>
      <div className="expertCore"><button className="expertStem" aria-pressed={pick.pillar===key&&pick.kind==='stem'} onClick={()=>setPick({pillar:key,kind:'stem'})} style={{'--cell':elementMeta[stems[item.stem].element].soft,'--cell-dark':elementMeta[stems[item.stem].element].dark} as CSSProperties}><small>CIELO</small><Glyph stem={item.stem} size={46}/><strong>{identityMeta[item.stem].name}</strong><span>{stems[item.stem].han} · {stems[item.stem].label}</span></button>
      <button className="expertBranch" aria-pressed={pick.pillar===key&&pick.kind==='branch'} onClick={()=>setPick({pillar:key,kind:'branch'})} style={{'--cell':elementMeta[branches[item.branch].element].soft,'--cell-dark':elementMeta[branches[item.branch].element].dark} as CSSProperties}><small>TIERRA</small><AnimalGlyph branch={item.branch} size={58}/><strong>{branches[item.branch].label}</strong><span>{elementMeta[branches[item.branch].element].label}</span></button></div>
      <div className="hiddenStems"><small>ENERGÍA DE FONDO</small>{item.hidden.map(hidden=><button key={hidden} aria-pressed={pick.pillar===key&&pick.kind==='hidden'&&pick.stem===hidden} onClick={()=>setPick({pillar:key,kind:'hidden',stem:hidden})} style={{'--chip':elementMeta[stems[hidden].element].soft,'--chip-dark':elementMeta[stems[hidden].element].dark} as CSSProperties}><Glyph stem={hidden} size={20}/><span>{identityMeta[hidden].name}</span></button>)}</div>
      {key!=='life'&&key!=='conception'&&chart.voidPillars.includes(key)&&<button className="voidBadge" aria-pressed={pick.pillar===key&&pick.kind==='void'} onClick={()=>setPick({pillar:key,kind:'void'})}>○ Aquí toca tu vacío</button>}
    </article>:<article className="expertLocked"><header><small>{meta.eyebrow}</small><b>{meta.title}</b><em>HORA ABIERTA</em></header><span className="voidGlyph">○</span><p>Agrega tu hora para calcular este palacio.</p></article>}{item&&pick.pillar===key&&explanation('expertInlineExplanation')}</div>})}</div><button type="button" className="expertCarouselArrow expertCarouselNext" onClick={()=>slide(1)} aria-label="Ver pilar siguiente">→</button></div>
    {explanation('expertExplanationBottom')}
  </section>
}

function TemporalStrip({chart,onTool}:{chart:Chart;onTool:(view:View)=>void}){
  const today=todayInZone(chart.birth.timezone),daily=dayReading(chart,today),parts=partsFromKey(today),monthly=monthReading(chart,parts.year,parts.month)
  const cycle=chart.birth.sexAtBirth?cycleReading(chart,chart.birth.sexAtBirth).current:null
  return <section className="readingSection temporalStrip" id="ahora"><SectionHead kicker="TU MOMENTO ACTUAL" title="Cada fecha activa una oportunidad diferente."/><div className="temporalCards">
    <button onClick={()=>onTool('today')}><AnimalGlyph branch={daily.pillar.branch}/><small>HOY</small><h3>{daily.rhythm}</h3><p>{daily.opportunity[0]} puede encontrar buen ritmo hoy.</p><span>Ver mi día →</span></button>
    <button onClick={()=>onTool('calendar')}><span className="cycleMark">▦</span><small>CALENDARIO</small><h3>Encuentra una fecha</h3><p>Explora cualquier día o busca cuándo conviene hacer algo concreto.</p><span>Abrir calendario →</span></button>
    <button onClick={()=>onTool('month')}><Glyph stem={monthly.pillar.stem} size={54}/><small>ESTE MES</small><h3>{monthly.area.title}</h3><p>{monthly.headline}</p><span>Ver mi mes →</span></button>
    <button onClick={()=>onTool('cycles')}><span className="cycleMark">↻</span><small>MI CICLO</small><h3>{cycle?cycle.title:'Tu etapa actual'}</h3><p>Cada diez años comienza una etapa con prioridades diferentes.</p><span>Ver mis ciclos →</span></button>
  </div></section>
}

function sameBirth(a:BirthInput,b:BirthInput){return a.date===b.date&&a.time===b.time&&a.name===b.name}
function ToolHeader({chart,library,active,onSwitch,onHome,onReading,onTool}:{chart:Chart;library:SavedMap[];active:BirthInput;onSwitch:(input:BirthInput)=>void;onHome:()=>void;onReading:()=>void;onTool:(view:View)=>void}){
  const selected=library.find(item=>sameBirth(item.input,active))?.id||'active'
  return <><header className="toolHeader"><button onClick={onHome}>← Tus cartas</button><Brand onNavigate={target=>target==='home'?onHome():target==='reading'?onReading():onTool(target)}/><button onClick={onReading}>Ver mi carta</button></header><div className="cardSwitcher"><span><Glyph stem={chart.dayMaster.stem} size={34}/><small>ESTÁS VIENDO</small></span><select aria-label="Cambiar carta" value={selected} onChange={event=>{const item=library.find(x=>x.id===event.target.value);if(item)onSwitch(item.input)}}>{selected==='active'&&<option value="active">{active.name||'Esta carta'} · {identityMeta[chart.dayMaster.stem].name}</option>}{library.map(item=>{const itemChart=calculateChart(item.input);return <option value={item.id} key={item.id}>{item.label} · {identityMeta[itemChart.dayMaster.stem].name}</option>})}</select></div></>
}
function ToolTabs({current,onTool}:{current:View;onTool:(view:View)=>void}){return <nav className="toolTabs" aria-label="Herramientas de tiempo"><button aria-current={current==='today'?'page':undefined} onClick={()=>onTool('today')}><span>☀</span>Hoy</button><button aria-current={current==='calendar'?'page':undefined} onClick={()=>onTool('calendar')}><span>▦</span>Calendario</button><button aria-current={current==='month'?'page':undefined} onClick={()=>onTool('month')}><span>◐</span>Tu mes</button><button aria-current={current==='cycles'?'page':undefined} onClick={()=>onTool('cycles')}><span>↻</span>Ciclos</button></nav>}

type ToolPageProps={chart:Chart;library:SavedMap[];active:BirthInput;onSwitch:(input:BirthInput)=>void;onHome:()=>void;onReading:()=>void;onTool:(view:View)=>void}
function TodayPage({chart,library,active,onSwitch,onHome,onReading,onTool}:ToolPageProps){
  const [selected,setSelected]=useState(()=>{const requested=new URLSearchParams(location.search).get('fecha');return requested&&/^\d{4}-\d{2}-\d{2}$/.test(requested)?requested:todayInZone(chart.birth.timezone)}),reading=useMemo(()=>dayReading(chart,selected),[chart,selected])
  const today=todayInZone(chart.birth.timezone)
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set('fecha',selected);history.replaceState({},'',url)},[selected])
  return <main className="toolPage"><ToolHeader chart={chart} library={library} active={active} onSwitch={onSwitch} onHome={onHome} onReading={onReading} onTool={onTool}/><ToolTabs current="today" onTool={onTool}/>
    <section className="timeHero"><div><p className="eyebrow">TU CALENDARIO PERSONAL</p><h1>{reading.headline}</h1><p>{reading.body} {reading.personal}</p><div className="timeHeroMeta"><Technical>{branches[reading.pillar.branch].label} · {stems[reading.pillar.stem].label}</Technical><AnimalGlyph branch={reading.pillar.branch} size={64}/></div></div></section>
    <section className="dayActions"><article><small>APROVECHA EL DÍA PARA</small><h2>Tres cosas que pueden fluir mejor</h2><ul>{reading.opportunity.map(item=><li key={item}>{item}</li>)}</ul></article><article><small>DEJA UN POCO MÁS DE MARGEN EN</small><h2>Dos decisiones para llevar con calma</h2><ul>{reading.margin.map(item=><li key={item}>{item}</li>)}</ul></article></section>
    <section className="todayShare"><div><p className="eyebrow">LLÉVATE TU DÍA</p><h2>Compártelo o guárdalo para tenerlo a la mano.</h2></div><div className="shareActions"><ShareButton kind="today" chart={chart} date={selected}>Compartir mi día</ShareButton><ShareButton kind="today" chart={chart} date={selected} downloadOnly>Descargar</ShareButton></div></section>
    <section className="calendarBridge"><span className="cycleMark">▦</span><div><p className="eyebrow">¿QUIERES VER OTRA FECHA?</p><h2>Explora el calendario completo.</h2><p>Mira cualquier día, recorre el mes o busca las mejores fechas para una actividad concreta.</p></div><button className="primary" onClick={()=>onTool('calendar')}>Abrir calendario <span>→</span></button>{selected!==today&&<button className="quietButton" onClick={()=>setSelected(today)}>Volver a hoy</button>}</section>
  </main>
}

type CalendarMode='day'|'month'|'search'
function CalendarModes({mode,onChange}:{mode:CalendarMode;onChange:(mode:CalendarMode)=>void}){return <nav className="calendarModes" aria-label="Vistas del calendario"><button aria-current={mode==='day'?'page':undefined} onClick={()=>onChange('day')}>Día</button><button aria-current={mode==='month'?'page':undefined} onClick={()=>onChange('month')}>Mes</button><button aria-current={mode==='search'?'page':undefined} onClick={()=>onChange('search')}>Buscar fecha</button></nav>}

function CalendarPage({chart,library,active,onSwitch,onHome,onReading,onTool}:ToolPageProps){
  const params=useMemo(()=>new URLSearchParams(location.search),[]),today=todayInZone(chart.birth.timezone)
  const requested=params.get('fecha'),initialDate=requested&&/^\d{4}-\d{2}-\d{2}$/.test(requested)?requested:today
  const requestedMode=params.get('modo'),[mode,setMode]=useState<CalendarMode>(requestedMode==='mes'?'month':requestedMode==='buscar'?'search':'day')
  const [selected,setSelected]=useState(initialDate),[activity,setActivity]=useState<ActivityKey>(()=>{const value=params.get('actividad') as ActivityKey;return value&&activities[value]?value:'finances'})
  const [searchYear,setSearchYear]=useState(()=>Number(params.get('anio'))||partsFromKey(initialDate).year),[detail,setDetail]=useState('')
  const parts=partsFromKey(selected),reading=useMemo(()=>dayReading(chart,selected),[chart,selected])
  const days=new Date(Date.UTC(parts.year,parts.month,0)).getUTCDate(),offset=new Date(Date.UTC(parts.year,parts.month-1,1)).getUTCDay()
  const results=useMemo(()=>mode==='search'?searchActivityYear(chart,searchYear,activity):[],[chart,searchYear,activity,mode]),resultMap=useMemo(()=>new Map(results.map(item=>[item.date,item])),[results])
  const counts=results.reduce((out,item)=>{out[item.state]++;return out},{good:0,move:0,neutral:0})
  const detailReading=detail?classifyActivity(chart,detail,activity):null
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set('fecha',selected);url.searchParams.set('modo',mode==='month'?'mes':mode==='search'?'buscar':'dia');url.searchParams.set('actividad',activity);url.searchParams.set('anio',String(searchYear));history.replaceState({},'',url)},[selected,mode,activity,searchYear])
  const moveMonth=(delta:number)=>{const d=new Date(Date.UTC(parts.year,parts.month-1+delta,1));setSelected(dateKey(d.getUTCFullYear(),d.getUTCMonth()+1,1))}
  const openToday=()=>{const url=new URL(location.href);url.searchParams.set('fecha',selected);history.replaceState({},'',url);onTool('today')}
  return <main className="toolPage calendarPage"><ToolHeader chart={chart} library={library} active={active} onSwitch={onSwitch} onHome={onHome} onReading={onReading} onTool={onTool}/><ToolTabs current="calendar" onTool={onTool}/>
    <header className="calendarIntro"><p className="eyebrow">TU CALENDARIO PERSONAL</p><h1 key={mode}>{mode==='search'?'¿Cuándo te conviene?':'Explora una fecha a la vez.'}</h1><p>Cada día combina su propio ritmo con la carta que elegiste arriba.</p><CalendarModes mode={mode} onChange={value=>{setMode(value);setDetail('')}}/></header>
    {mode==='day'&&<section className="calendarDayView calendarModeEnter" key={`day-${selected}`}><nav className="dayStepper"><button onClick={()=>setSelected(shiftDate(selected,-1))} aria-label="Día anterior">←</button>{selected===today?<span className="todayStatus">HOY</span>:<button className="goToday" onClick={()=>setSelected(today)}>Ir a hoy</button>}<button onClick={()=>setSelected(shiftDate(selected,1))} aria-label="Día siguiente">→</button></nav><article className="dayCard calendarSwap"><p className="eyebrow">{formatLongDate(selected).toUpperCase()}</p><div className="dayCardIdentity"><AnimalGlyph branch={reading.pillar.branch} size={96}/><div><h2>{reading.rhythm}</h2><span>{dayScoreLabel(reading.score)}</span></div></div><p className="dayLead">{reading.body} {reading.personal}</p><div className="scoreTrack"><i style={{width:`${reading.score}%`}}/></div><div className="dayCardLists"><div><small>PUEDE FLUIR MEJOR</small><ul>{reading.opportunity.map(item=><li key={item}>{item}</li>)}</ul></div><div><small>LLÉVALO CON MÁS MARGEN</small><ul>{reading.margin.map(item=><li key={item}>{item}</li>)}</ul></div></div><button className="primary" onClick={openToday}>Ver la lectura completa de este día <span>→</span></button></article></section>}
    {mode==='month'&&<section className="calendarMonthView calendarModeEnter" key={`month-${parts.year}-${parts.month}`}><header className="periodNav"><button onClick={()=>moveMonth(-1)} aria-label="Mes anterior">←</button><h2>{monthLabel(parts.year,parts.month)}</h2><button onClick={()=>moveMonth(1)} aria-label="Mes siguiente">→</button></header><div className="calendarGrid calendarGridScores">{['D','L','M','M','J','V','S'].map((day,index)=><small key={`${day}-${index}`}>{day}</small>)}{Array.from({length:offset},(_,i)=><i key={`empty-${i}`}/>) }{Array.from({length:days},(_,index)=>{const key=dateKey(parts.year,parts.month,index+1),day=dayReading(chart,key);return <button key={key} className={`calendarCellIn ${key===selected?'selected ':''}${key===today?'today':''}`} style={{animationDelay:`${Math.min(index*14,360)}ms`} as CSSProperties} onClick={()=>{setSelected(key);setMode('day')}} aria-label={`${formatLongDate(key)}. ${dayScoreLabel(day.score)}`}><b>{index+1}</b><AnimalGlyph branch={day.pillar.branch} size={28}/><span className="dayScoreDot" style={{'--score':day.score/100} as CSSProperties}/><small>{day.rhythm}</small></button>})}</div></section>}
    {mode==='search'&&<section className="dateSearch calendarModeEnter" key={`search-${searchYear}-${activity}`}><article className="searchControls"><div><p className="eyebrow">BUSCA UNA FECHA</p><h2>¿Qué quieres hacer?</h2></div><label>Actividad<select value={activity} onChange={event=>{setActivity(event.target.value as ActivityKey);setDetail('')}}>{Object.entries(activities).map(([key,item])=><option value={key} key={key}>{item.name}</option>)}</select><small>{activities[activity].help}</small></label><div className="searchYear"><button onClick={()=>setSearchYear(value=>value-1)} aria-label="Año anterior">←</button><b>{searchYear}</b><button onClick={()=>setSearchYear(value=>value+1)} aria-label="Año siguiente">→</button></div><button className="quietButton" onClick={()=>setSearchYear(partsFromKey(today).year)}>Este año</button></article><div className="searchSummary"><span><b>{counts.good}</b>Buen encaje</span><span><b>{counts.move}</b>Mejor moverlo</span><span><b>{counts.neutral}</b>Neutral</span></div><p className="searchHint">Toca cualquier fecha para revisar por qué cayó en ese resultado.</p><div className="yearCalendars">{Array.from({length:12},(_,monthIndex)=>{const month=monthIndex+1,monthDays=new Date(Date.UTC(searchYear,month,0)).getUTCDate(),monthOffset=new Date(Date.UTC(searchYear,month-1,1)).getUTCDay();return <article className="miniMonth" key={month} style={{animationDelay:`${monthIndex*38}ms`}}><h3>{monthLabel(searchYear,month).replace(` ${searchYear}`,'')}</h3><div>{['D','L','M','M','J','V','S'].map((day,index)=><small key={`${day}-${index}`}>{day}</small>)}{Array.from({length:monthOffset},(_,i)=><i key={i}/>)}{Array.from({length:monthDays},(_,index)=>{const key=dateKey(searchYear,month,index+1),result=resultMap.get(key);return <button key={key} className={`${result?.state||'neutral'} ${detail===key?'selected':''}`} onClick={()=>setDetail(key)} aria-label={`${index+1} de ${monthLabel(searchYear,month)}. ${result?.state==='good'?'Buen encaje':result?.state==='move'?'Mejor moverlo':'Neutral'}`}>{index+1}</button>})}</div></article>})}</div>{detailReading&&<aside className={`searchDetail ${detailReading.state}`}><button onClick={()=>setDetail('')} aria-label="Cerrar detalle">×</button><p className="eyebrow">{detailReading.state==='good'?'BUEN ENCAJE':detailReading.state==='move'?'MEJOR MOVERLO':'FECHA NEUTRAL'}</p><h2>{formatLongDate(detail)}</h2><p>{detailReading.reason}</p><small>{detailReading.reading.rhythm} · {branches[detailReading.reading.pillar.branch].label}</small><button className="primary" onClick={()=>{setSelected(detail);setMode('day')}}>Ver este día <span>→</span></button></aside>}</section>}
  </main>
}

function MonthPage({chart,library,active,onSwitch,onHome,onReading,onTool}:ToolPageProps){
  const now=partsFromKey(todayInZone(chart.birth.timezone)),[period,setPeriod]=useState(()=>{const requested=new URLSearchParams(location.search).get('periodo');if(requested&&/^\d{4}-\d{2}$/.test(requested)){const [year,month]=requested.split('-').map(Number);return {year,month}}return {year:now.year,month:now.month}}),reading=useMemo(()=>monthReading(chart,period.year,period.month),[chart,period])
  const move=(delta:number)=>{const d=new Date(Date.UTC(period.year,period.month-1+delta,15));setPeriod({year:d.getUTCFullYear(),month:d.getUTCMonth()+1})}
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set('periodo',`${period.year}-${String(period.month).padStart(2,'0')}`);history.replaceState({},'',url)},[period])
  const openDay=(key:string)=>{const url=new URL(location.href);url.searchParams.set('fecha',key);history.replaceState({},'',url);onTool('today')}
  return <main className="toolPage"><ToolHeader chart={chart} library={library} active={active} onSwitch={onSwitch} onHome={onHome} onReading={onReading} onTool={onTool}/><ToolTabs current="month" onTool={onTool}/>
    <section className="timeHero monthHero"><div><p className="eyebrow">TU MES · {monthLabel(period.year,period.month)}</p><h1>{reading.headline}</h1><p>{reading.area.intro} {reading.personal}</p><div className="timeHeroMeta"><Technical>{identityMeta[reading.pillar.stem].name} · {branches[reading.pillar.branch].label} · {stems[reading.pillar.stem].han} {stems[reading.pillar.stem].label}</Technical><Glyph stem={reading.pillar.stem} size={64}/></div></div></section>
    <div className="periodNav"><button onClick={()=>move(-1)}>← Mes anterior</button><button onClick={()=>setPeriod({year:now.year,month:now.month})}>Este mes</button><button onClick={()=>move(1)}>Mes siguiente →</button></div>
    <section className="monthLayout"><article className="monthFocus"><div><p className="eyebrow">PON LA ENERGÍA A TU FAVOR</p><h2>{reading.area.title}</h2><p>{reading.area.theme}</p></div><ol>{reading.area.actions.map(item=><li key={item}>{item}</li>)}</ol></article><div className="monthDetail"><article><small>PON ATENCIÓN</small><h3>Administra tu margen</h3><p>{reading.area.care}</p></article><article><small>FECHAS CON BUEN RITMO</small><h3>Tres oportunidades del mes</h3><div className="featuredDays">{reading.featured.map(day=><button key={day.date} onClick={()=>openDay(day.date)}><span className="featuredDate"><small>DÍA</small><b>{partsFromKey(day.date).day}</b></span><span>{day.rhythm}</span><small>{day.opportunity[0]}</small></button>)}</div></article></div></section>
  </main>
}

function CyclesPage({chart,library,active,onSwitch,onHome,onReading,onTool,onSetSex}:ToolPageProps&{onSetSex:(sex:'female'|'male')=>void}){
  if(!chart.birth.sexAtBirth)return <main className="toolPage"><ToolHeader chart={chart} library={library} active={active} onSwitch={onSwitch} onHome={onHome} onReading={onReading} onTool={onTool}/><ToolTabs current="cycles" onTool={onTool}/><section className="cycleSetup"><span className="cycleMark">↻</span><p className="eyebrow">UN DATO PARA CALCULAR TUS CICLOS</p><h1>¿Qué sexo te registraron al nacer?</h1><p>El método tradicional usa este dato para definir la dirección de la secuencia de diez años. Se guarda únicamente dentro de esta carta.</p><div className="cycleChoices"><button onClick={()=>onSetSex('female')}>Mujer</button><button onClick={()=>onSetSex('male')}>Hombre</button></div></section></main>
  const reading=cycleReading(chart,chart.birth.sexAtBirth),current=reading.current
  return <main className="toolPage"><ToolHeader chart={chart} library={library} active={active} onSwitch={onSwitch} onHome={onHome} onReading={onReading} onTool={onTool}/><ToolTabs current="cycles" onTool={onTool}/>
    <section className="timeHero cycleHero"><div><p className="eyebrow">TU CICLO ACTUAL · {current.startYear}—{current.endYear}</p><h1>Tu ciclo actual es: {current.title}.</h1><p>{current.body}</p><div className="timeHeroMeta"><Technical>{stems[current.pillar.stem].han} · {stems[current.pillar.stem].label} · {branches[current.pillar.branch].label}</Technical><AnimalGlyph branch={current.pillar.branch} size={64}/></div></div></section>
    <section className="cycleIntro"><p>Cada diez años comienza una etapa de vida con prioridades y recursos distintos. Tu secuencia empezó alrededor de los {reading.startAge} años.</p></section>
    <ol className="cycleTimeline">{reading.items.map(item=><li className={item.current?'current':''} key={item.startYear}><div className="cycleYears"><b>{item.startYear}</b><span>{item.endYear}</span><small>{item.startAge}—{item.endAge} años</small></div><AnimalGlyph branch={item.pillar.branch} size={50}/><div><small>{item.current?'AQUÍ ESTÁS AHORA':item.focus.toUpperCase()}</small><h2>{item.title}</h2><p>{item.body}</p></div></li>)}</ol>
  </main>
}
function SectionHead({kicker,title}:{kicker:string;title:string}){return <header className="sectionHead"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div></header>}
