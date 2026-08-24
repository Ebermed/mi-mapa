import { Solar } from 'lunar-javascript'
import {
  branchOrder, branches, branchPace, elementMeta, identityMeta, stems,
  type BranchKey, type Chart, type ElementKey, type Pillar, type PillarKey, type StemKey,
} from './engine'

const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const WEEKDAYS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const stemFromHan=Object.fromEntries(Object.entries(stems).map(([key,value])=>[value.han,key])) as Record<string,StemKey>
const branchFromHan=Object.fromEntries(Object.entries(branches).map(([key,value])=>[value.han,key])) as Record<string,BranchKey>

export type DayReading={
  date:string; pillar:Pillar; monthPillar:Pillar; rhythm:string; headline:string; body:string
  opportunity:string[]; margin:string[]; personal:string; score:number
}

const DAY_RHYTHMS=[
  {name:'Arrancar',weight:10,body:'Este ritmo ayuda a convertir una intención clara en movimiento.',good:['empezar un curso','iniciar un proyecto','hacer una primera reunión'],margin:['cerrar una etapa de forma definitiva','tomar una decisión difícil de revertir']},
  {name:'Depurar',weight:2,body:'Este ritmo ayuda a quitar peso, cerrar pendientes y dejar espacio para lo que sigue.',good:['vaciar pendientes','editar y recortar','ordenar archivos'],margin:['hacer un gran lanzamiento','asumir un compromiso largo']},
  {name:'Reunir',weight:9,body:'Este ritmo acompaña lo que implica reunir personas, recursos, respuestas o piezas dispersas.',good:['cobrar pendientes','reunir al equipo','recibir entregas'],margin:['aceptar obligaciones poco claras','llenar la agenda']},
  {name:'Ajustar',weight:5,body:'Este ritmo ayuda cuando varias partes necesitan acomodarse entre sí.',good:['negociar condiciones','repartir tareas','coordinar agendas'],margin:['forzar una decisión rápida','cambiar varias cosas a la vez']},
  {name:'Afianzar',weight:10,body:'Este ritmo acompaña decisiones que ya pensaste y quieres sostener con firmeza.',good:['formalizar un acuerdo','definir una rutina','confirmar un plan'],margin:['cambiar de rumbo por impulso','improvisar una salida costosa']},
  {name:'Ejecutar',weight:6,body:'Este ritmo pide manos a la obra y favorece convertir una decisión en algo concreto.',good:['enviar una propuesta','retomar una tarea','resolver un trámite'],margin:['abrir demasiados frentes','sumar compromisos']},
  {name:'Desmontar',weight:-9,body:'Este ritmo ayuda a desarmar estructuras agotadas y recuperar espacio.',good:['cerrar un proceso obsoleto','cancelar un plan agotado','recortar gastos'],margin:['firmar un acuerdo largo','hacer un lanzamiento grande']},
  {name:'Revisar',weight:-5,body:'Este ritmo agradece margen para probar, revisar y hacer cambios pequeños.',good:['probar un prototipo','revisar documentos','corregir errores'],margin:['asumir un compromiso difícil de revertir','hacer una compra impulsiva']},
  {name:'Consolidar',weight:14,body:'Este ritmo ayuda a cerrar bien lo que ya venías trabajando.',good:['cerrar un proyecto','presentar un resultado','entregar trabajo'],margin:['abrir una discusión sin preparación','cambiar el objetivo al final']},
  {name:'Captar',weight:8,body:'Este ritmo mueve respuestas, pagos, comentarios, entregas y recursos de regreso hacia ti.',good:['pedir retroalimentación','cobrar un pendiente','evaluar una oferta'],margin:['aceptar condiciones sin revisar','acumular tareas nuevas']},
  {name:'Mostrar',weight:10,body:'Este ritmo abre puertas hacia afuera y acompaña la visibilidad.',good:['hacer una presentación','publicar un lanzamiento','conocer gente nueva'],margin:['guardar una conversación importante para última hora','exponer un tema privado']},
  {name:'Pausa',weight:-5,body:'Este ritmo baja el volumen y favorece recuperar capacidad.',good:['hacer respaldos','cerrar pendientes menores','descansar'],margin:['hacer un lanzamiento importante','llenar la agenda']},
]

const generates:Record<ElementKey,ElementKey>={wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood'}
const controls:Record<ElementKey,ElementKey>={wood:'earth',earth:'water',water:'fire',fire:'metal',metal:'wood'}
const AREAS={
  peers:{title:'Vínculos',theme:'personas, acuerdos y límites',intro:'Las relaciones y el reparto de responsabilidades ganan presencia.',actions:['pedir con claridad lo que necesitas','acordar responsabilidades antes de asumirlas','elegir vínculos donde el apoyo circule en ambos sentidos'],care:'Repartir tu atención entre demasiadas personas puede quitar espacio a tus propias prioridades.'},
  output:{title:'Expresión',theme:'ideas, producción y visibilidad',intro:'Las ideas buscan convertirse en algo visible y compartible.',actions:['terminar una pieza antes de abrir otro frente','mostrar una versión clara y aprender de la respuesta','reservar tiempo para sostener lo que publiques'],care:'El entusiasmo puede abrir más proyectos de los que tu calendario alcanza a sostener.'},
  resources:{title:'Recursos',theme:'dinero, intercambio y resultados',intro:'Los recursos y los resultados concretos piden decisiones claras.',actions:['poner números y condiciones antes de comprometerte','cerrar fugas pequeñas de tiempo o dinero','convertir una oportunidad en un plan con fecha'],care:'Una oportunidad atractiva puede crecer demasiado rápido cuando falta una medida clara de tiempo, dinero o energía.'},
  structure:{title:'Estructura',theme:'responsabilidades, reglas y prioridades',intro:'Las responsabilidades y los plazos ganan volumen.',actions:['separar obligación real de presión aprendida','poner estructura a una prioridad','responder desde tu criterio frente a cada exigencia'],care:'Tratar cada expectativa como urgente puede convertir la estructura en presión acumulada.'},
  support:{title:'Perspectiva',theme:'aprendizaje, apoyo e información',intro:'La información y el apoyo pueden cambiar la forma de entender un problema.',actions:['buscar una fuente o persona con experiencia','darle tiempo a la información para acomodarse','convertir lo aprendido en una acción comprobable'],care:'Revisar demasiados escenarios puede consumir el momento que también necesita una decisión.'},
}

function pad(value:number){return String(value).padStart(2,'0')}
export function dateKey(year:number,month:number,day:number){return `${year}-${pad(month)}-${pad(day)}`}
export function partsFromKey(key:string){const [year,month,day]=key.split('-').map(Number);return{year,month,day}}
export function shiftDate(key:string,days:number){const p=partsFromKey(key),d=new Date(Date.UTC(p.year,p.month-1,p.day+days));return dateKey(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
export function todayInZone(timezone:string){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
  const values=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]))
  return `${values.year}-${values.month}-${values.day}`
}
export function formatLongDate(key:string){const p=partsFromKey(key),d=new Date(Date.UTC(p.year,p.month-1,p.day));return `${WEEKDAYS[d.getUTCDay()]} ${p.day} de ${MONTHS[p.month-1]}`}
export function monthLabel(year:number,month:number){return `${MONTHS[month-1]} ${year}`}

function transitPillars(key:string,time='12:00'){
  const p=partsFromKey(key),[hour,minute]=time.split(':').map(Number),ec=Solar.fromYmdHms(p.year,p.month,p.day,hour,minute,0).getLunar().getEightChar()
  const pillar=(gan:string,zhi:string):Pillar=>{const stem=stemFromHan[gan],branch=branchFromHan[zhi];return{stem,branch,hidden:branches[branch].hidden}}
  return {year:pillar(ec.getYearGan(),ec.getYearZhi()),month:pillar(ec.getMonthGan(),ec.getMonthZhi()),day:pillar(ec.getDayGan(),ec.getDayZhi()),hour:pillar(ec.getTimeGan(),ec.getTimeZhi())} as Record<PillarKey,Pillar>
}

function branchConnection(visitor:BranchKey,chart:Chart){
  const pairs:[[BranchKey,BranchKey],string][]=[
    [['rat','ox'],'encuentra apoyo'],[['tiger','pig'],'encuentra apoyo'],[['rabbit','dog'],'encuentra apoyo'],[['dragon','rooster'],'encuentra apoyo'],[['snake','monkey'],'encuentra apoyo'],[['horse','goat'],'encuentra apoyo'],
    [['rat','horse'],'pide ajustar ritmos'],[['ox','goat'],'pide ajustar ritmos'],[['tiger','monkey'],'pide ajustar ritmos'],[['rabbit','rooster'],'pide ajustar ritmos'],[['dragon','dog'],'pide ajustar ritmos'],[['snake','pig'],'pide ajustar ritmos'],
  ]
  for(const [key,pillar] of Object.entries(chart.pillars) as [PillarKey,Pillar][]){
    if(pillar.branch===visitor)return `El día repite el ritmo de ${key==='year'?'tu origen':key==='month'?'cómo avanzas':key==='day'?'tu centro':'lo que construyes'} y le da más volumen.`
    const match=pairs.find(([pair])=>pair.includes(visitor)&&pair.includes(pillar.branch))
    if(match)return `El día ${match[1]} en ${key==='year'?'tu origen':key==='month'?'cómo avanzas':key==='day'?'tu centro':'lo que construyes'}.`
  }
  return 'El día suma un ritmo distinto a tus cuatro pilares y abre espacio para probar otra manera de avanzar.'
}

export function dayReading(chart:Chart,key:string):DayReading{
  const transit=transitPillars(key),monthIndex=branchOrder.indexOf(transit.month.branch),dayIndex=branchOrder.indexOf(transit.day.branch)
  const rhythm=DAY_RHYTHMS[(dayIndex-monthIndex+12)%12]
  return {date:key,pillar:transit.day,monthPillar:transit.month,rhythm:rhythm.name,headline:`${formatLongDate(key)} es un día para ${rhythm.name.toLowerCase()}.`,body:rhythm.body,opportunity:rhythm.good,margin:rhythm.margin,personal:branchConnection(transit.day.branch,chart),score:rhythm.weight}
}

function areaFor(dayElement:ElementKey,visitor:ElementKey){
  if(dayElement===visitor)return AREAS.peers
  if(generates[dayElement]===visitor)return AREAS.output
  if(controls[dayElement]===visitor)return AREAS.resources
  if(controls[visitor]===dayElement)return AREAS.structure
  return AREAS.support
}

export function monthReading(chart:Chart,year:number,month:number){
  const key=dateKey(year,month,15),pillar=transitPillars(key).month,area=areaFor(chart.dayMaster.element,stems[pillar.stem].element)
  const days=Array.from({length:new Date(Date.UTC(year,month,0)).getUTCDate()},(_,index)=>dayReading(chart,dateKey(year,month,index+1)))
  const featured=[...days].sort((a,b)=>b.score-a.score).slice(0,3)
  return {year,month,pillar,area,days,featured,headline:`Este ${MONTHS[month-1]} te trae más movimiento en ${area.theme}.`,personal:branchConnection(pillar.branch,chart)}
}

export type CycleItem={startYear:number;endYear:number;startAge:number;endAge:number;pillar:Pillar;current:boolean;title:string;body:string;focus:string}
export function cycleReading(chart:Chart,sex:'female'|'male',today=new Date()):{startAge:number;items:CycleItem[];current:CycleItem}{
  const p=partsFromKey(chart.birth.calculationDate),[hour,minute]=chart.birth.calculationTime.split(':').map(Number)
  const eightChar=Solar.fromYmdHms(p.year,p.month,p.day,hour,minute,0).getLunar().getEightChar()
  const daYun=eightChar.getYun(sex==='male'?1:0).getDaYun(10).filter((item:any)=>item.getIndex()>0)
  const items=daYun.map((item:any)=>{
    const value=String(item.getGanZhi()),stem=stemFromHan[value.charAt(0)],branch=branchFromHan[value.charAt(1)],pillar={stem,branch,hidden:branches[branch].hidden}
    const area=areaFor(chart.dayMaster.element,stems[stem].element),current=today.getFullYear()>=item.getStartYear()&&today.getFullYear()<=item.getEndYear()
    return {startYear:item.getStartYear(),endYear:item.getEndYear(),startAge:item.getStartAge(),endAge:item.getEndAge(),pillar,current,title:`${identityMeta[stem].name} · ${branches[branch].label}`,body:`${identityMeta[stem].body} ${branchPace[branch]}`,focus:area.title} as CycleItem
  })
  return {startAge:items[0]?.startAge||1,items,current:items.find((item:CycleItem)=>item.current)||items[0]}
}

export function elementForPillar(pillar:Pillar){return elementMeta[stems[pillar.stem].element]}
