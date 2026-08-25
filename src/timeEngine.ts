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
  opportunity:string[]; margin:string[]; personal:string; score:number; personalClash:PersonalClash
}

export type PersonalClash={active:boolean;birthBranch:BranchKey;dayBranch:BranchKey;title:string;body:string}

export type ActivityKey='finances'|'collect'|'purchase'|'agreement'|'launch'|'project'|'responsibility'|'study'|'travel'|'negotiate'|'social'|'close'
export const activities:Record<ActivityKey,{name:string;help:string;good:string[];move:string[]}>= {
  finances:{name:'Dinero y finanzas',help:'Pagos, presupuesto, ventas, compras planeadas y decisiones de recursos.',good:['Reunir','Captar','Consolidar','Afianzar'],move:['Desmontar','Pausa']},
  collect:{name:'Cobrar o recibir un pago',help:'Cobros pendientes, compensaciones y entradas de dinero.',good:['Captar','Reunir','Consolidar'],move:['Pausa','Revisar']},
  purchase:{name:'Hacer una compra importante',help:'Compras planeadas, comparación de precios y uso de presupuesto.',good:['Afianzar','Consolidar','Revisar'],move:['Desmontar','Pausa']},
  agreement:{name:'Firmar o negociar un acuerdo',help:'Contratos, condiciones, propuestas, permisos y negociación.',good:['Ajustar','Afianzar','Consolidar'],move:['Desmontar','Pausa']},
  launch:{name:'Lanzar, publicar o presentar',help:'Presentaciones, publicaciones, campañas y visibilidad.',good:['Mostrar','Consolidar','Ejecutar'],move:['Pausa','Desmontar','Revisar']},
  project:{name:'Iniciar o mover un proyecto',help:'Primeras reuniones, líneas de trabajo, proyectos y ejecución.',good:['Arrancar','Ejecutar','Consolidar'],move:['Pausa','Desmontar']},
  responsibility:{name:'Asumir más responsabilidad',help:'Promociones, nuevas responsabilidades, coordinación y trabajo.',good:['Afianzar','Consolidar','Ajustar'],move:['Revisar','Pausa']},
  study:{name:'Estudiar o iniciar un curso',help:'Estudio, investigación, escritura, cursos y preparación.',good:['Arrancar','Revisar','Afianzar'],move:['Desmontar']},
  travel:{name:'Viajar',help:'Traslados y viajes que conviene iniciar con margen.',good:['Ejecutar','Mostrar','Arrancar'],move:['Pausa','Desmontar']},
  negotiate:{name:'Pedir apoyo o negociar',help:'Apoyos, permisos, colaboración y conversaciones con acuerdos.',good:['Ajustar','Captar','Reunir'],move:['Desmontar','Pausa']},
  social:{name:'Reunirte y conectar con gente',help:'Reuniones, celebraciones, convocatorias y colaboración.',good:['Reunir','Mostrar','Captar'],move:['Pausa','Desmontar']},
  close:{name:'Cerrar, cancelar o depurar',help:'Terminar pendientes, recortar, cancelar y cerrar procesos.',good:['Desmontar','Depurar','Consolidar'],move:['Arrancar','Reunir']},
}
export type ActivityResult={date:string;state:'good'|'move'|'neutral';reading:DayReading;reason:string}

const DAY_RHYTHMS=[
  {name:'Arrancar',weight:10,body:'Elige una tarea pendiente y da el primer paso.',good:['empezar un curso','iniciar un proyecto','hacer una primera reunión'],margin:['cerrar una etapa de forma definitiva','tomar una decisión difícil de revertir']},
  {name:'Depurar',weight:2,body:'Termina pendientes, ordena archivos o quita de tu agenda lo que ya estorba.',good:['vaciar pendientes','editar y recortar','ordenar archivos'],margin:['hacer un gran lanzamiento','asumir un compromiso largo']},
  {name:'Reunir',weight:9,body:'Junta a las personas, respuestas o recursos que necesitas.',good:['cobrar pendientes','reunir al equipo','recibir entregas'],margin:['aceptar obligaciones poco claras','llenar la agenda']},
  {name:'Ajustar',weight:5,body:'Revisa horarios, tareas y acuerdos para que las partes encajen.',good:['negociar condiciones','repartir tareas','coordinar agendas'],margin:['forzar una decisión rápida','cambiar varias cosas a la vez']},
  {name:'Afianzar',weight:10,body:'Confirma una decisión, una rutina o un acuerdo que quieres mantener.',good:['formalizar un acuerdo','definir una rutina','confirmar un plan'],margin:['cambiar de rumbo por impulso','improvisar una salida costosa']},
  {name:'Ejecutar',weight:6,body:'Toma una decisión que ya pensaste y conviértela en una acción.',good:['enviar una propuesta','retomar una tarea','resolver un trámite'],margin:['abrir demasiados frentes','sumar compromisos']},
  {name:'Desmontar',weight:-9,body:'Cancela, recorta o termina algo que ya dejó de servirte.',good:['cerrar un proceso obsoleto','cancelar un plan agotado','recortar gastos'],margin:['firmar un acuerdo largo','hacer un lanzamiento grande']},
  {name:'Revisar',weight:-5,body:'Prueba, corrige y vuelve a mirar los detalles antes de comprometerte.',good:['probar un prototipo','revisar documentos','corregir errores'],margin:['asumir un compromiso difícil de revertir','hacer una compra impulsiva']},
  {name:'Consolidar',weight:14,body:'Termina y entrega algo que ya venías trabajando.',good:['cerrar un proyecto','presentar un resultado','entregar trabajo'],margin:['abrir una discusión sin preparación','cambiar el objetivo al final']},
  {name:'Recibir',weight:8,body:'Pide respuestas, cobra pendientes o revisa lo que llegó.',good:['pedir retroalimentación','cobrar un pendiente','evaluar una oferta'],margin:['aceptar condiciones sin revisar','acumular tareas nuevas']},
  {name:'Mostrar',weight:10,body:'Presenta, publica o comparte algo que quieres dar a conocer.',good:['hacer una presentación','publicar un lanzamiento','conocer gente nueva'],margin:['guardar una conversación importante para última hora','exponer un tema privado']},
  {name:'Descansar',weight:-5,body:'Haz menos, termina pendientes pequeños y deja tiempo libre en tu agenda.',good:['hacer respaldos','cerrar pendientes menores','descansar'],margin:['hacer un lanzamiento importante','llenar la agenda']},
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
export function todayInZone(timezone:string,now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const values=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]))
  return `${values.year}-${values.month}-${values.day}`
}
export function formatLongDate(key:string){const p=partsFromKey(key),d=new Date(Date.UTC(p.year,p.month-1,p.day));return `${WEEKDAYS[d.getUTCDay()]} ${p.day} de ${MONTHS[p.month-1]}`}
export function formatFullDate(key:string){const p=partsFromKey(key);return `${formatLongDate(key)} de ${p.year}`}
export function monthLabel(year:number,month:number){return `${MONTHS[month-1]} ${year}`}

function transitPillars(key:string,time='12:00'){
  const p=partsFromKey(key),[hour,minute]=time.split(':').map(Number),ec=Solar.fromYmdHms(p.year,p.month,p.day,hour,minute,0).getLunar().getEightChar()
  const pillar=(gan:string,zhi:string):Pillar=>{const stem=stemFromHan[gan],branch=branchFromHan[zhi];return{stem,branch,hidden:branches[branch].hidden}}
  return {year:pillar(ec.getYearGan(),ec.getYearZhi()),month:pillar(ec.getMonthGan(),ec.getMonthZhi()),day:pillar(ec.getDayGan(),ec.getDayZhi()),hour:pillar(ec.getTimeGan(),ec.getTimeZhi())} as Record<PillarKey,Pillar>
}

function branchConnection(visitor:BranchKey,chart:Chart){
  const pairs:[[BranchKey,BranchKey],'support'|'clash'][]=[
    [['rat','ox'],'support'],[['tiger','pig'],'support'],[['rabbit','dog'],'support'],[['dragon','rooster'],'support'],[['snake','monkey'],'support'],[['horse','goat'],'support'],
    [['rat','horse'],'clash'],[['ox','goat'],'clash'],[['tiger','monkey'],'clash'],[['rabbit','rooster'],'clash'],[['dragon','dog'],'clash'],[['snake','pig'],'clash'],
  ]
  const dayLabel=branches[visitor].label
  for(const [key,pillar] of (Object.entries(chart.pillars) as [PillarKey,Pillar][]).filter(([key])=>!(chart.birth.timeUnknown&&key==='hour'))){
    const area=key==='year'?'tu año':key==='month'?'tu manera de avanzar':key==='day'?'tu centro':'tus proyectos'
    if(pillar.branch===visitor)return `El ${dayLabel} del día también aparece en ${area}; esta recomendación puede resultarte especialmente familiar.`
    const match=pairs.find(([pair])=>pair.includes(visitor)&&pair.includes(pillar.branch))
    if(match?.[1]==='support')return `El ${dayLabel} del día combina bien con el animal de ${area}; las tareas compartidas pueden avanzar con mayor facilidad.`
    if(match?.[1]==='clash')return `El ${dayLabel} del día es opuesto al animal de ${area}; deja espacio para cambios de plan y revisa antes de decidir.`
  }
  return `El ${dayLabel} del día aporta una forma de actuar distinta a las que aparecen en tu carta. Prueba la recomendación en una tarea concreta.`
}

const clashes:Record<BranchKey,BranchKey>={rat:'horse',ox:'goat',tiger:'monkey',rabbit:'rooster',dragon:'dog',snake:'pig',horse:'rat',goat:'ox',monkey:'tiger',rooster:'rabbit',dog:'dragon',pig:'snake'}
const harmonies:Record<BranchKey,BranchKey>={rat:'ox',ox:'rat',tiger:'pig',pig:'tiger',rabbit:'dog',dog:'rabbit',dragon:'rooster',rooster:'dragon',snake:'monkey',monkey:'snake',horse:'goat',goat:'horse'}

export function personalClashReading(chart:Chart,dayBranch:BranchKey):PersonalClash{
  const birthBranch=chart.pillars.year.branch,active=clashes[birthBranch]===dayBranch
  const dayLabel=branches[dayBranch].label,birthLabel=branches[birthBranch].label
  return {active,birthBranch,dayBranch,title:active?`${dayLabel} choca con ${birthLabel}`:'',body:active?`${dayLabel} y ${birthLabel}, el animal de tu año, son opuestos. Este día puede traer cambios, contratiempos o planes que se mueven de forma inesperada. Conviene dejar margen, revisar dos veces y reservar las decisiones de largo plazo para otra fecha.`:''}
}

function personalScore(day:BranchKey,chart:Chart){
  let score=0
  for(const [key,pillar] of Object.entries(chart.pillars) as [PillarKey,Pillar][]){
    if(chart.birth.timeUnknown&&key==='hour')continue
    if(pillar.branch===day)score+=3
    if(clashes[pillar.branch]===day)score-=7
    if(harmonies[pillar.branch]===day)score+=4
  }
  return Math.max(-14,Math.min(10,score))
}

export function dayReading(chart:Chart,key:string):DayReading{
  const transit=transitPillars(key),monthIndex=branchOrder.indexOf(transit.month.branch),dayIndex=branchOrder.indexOf(transit.day.branch)
  const rhythm=DAY_RHYTHMS[(dayIndex-monthIndex+12)%12]
  const friction=clashes[transit.month.branch]===transit.day.branch?-10:0,score=Math.max(8,Math.min(94,60+rhythm.weight+friction+personalScore(transit.day.branch,chart)))
  return {date:key,pillar:transit.day,monthPillar:transit.month,rhythm:rhythm.name,headline:`${formatLongDate(key)} es un buen día para ${rhythm.name.toLowerCase()}.`,body:rhythm.body,opportunity:rhythm.good,margin:rhythm.margin,personal:branchConnection(transit.day.branch,chart),score,personalClash:personalClashReading(chart,transit.day.branch)}
}

export function generalDayReading(key:string){
  const transit=transitPillars(key),monthIndex=branchOrder.indexOf(transit.month.branch),dayIndex=branchOrder.indexOf(transit.day.branch)
  const rhythm=DAY_RHYTHMS[(dayIndex-monthIndex+12)%12]
  return {date:key,pillar:transit.day,monthPillar:transit.month,rhythm:rhythm.name,body:rhythm.body,opportunity:rhythm.good,margin:rhythm.margin}
}

export function dayScoreLabel(score:number){if(score>=75)return 'Buen día para avanzar';if(score>=60)return 'Puede ayudarte a moverlo';if(score>=45)return 'Conviene elegir bien la actividad';return 'Conviene dejar más margen'}

export function classifyActivity(chart:Chart,key:string,activity:ActivityKey):ActivityResult{
  const reading=dayReading(chart,key),rule=activities[activity]
  const supports=rule.good.includes(reading.rhythm),slows=rule.move.includes(reading.rhythm)
  const state:ActivityResult['state']=reading.personalClash.active||slows||reading.score<42?'move':supports&&reading.score>=58?'good':'neutral'
  const baseReason=state==='good'?`${reading.rhythm} acompaña esta actividad y la fecha tiene buen margen para tu carta.`:state==='move'?`${reading.rhythm} pide más preparación para esta actividad y tu carta agradece margen de maniobra.`:`La fecha reúne señales mixtas para esta actividad. Puedes usarla si mantienes el plan flexible.`
  const reason=reading.personalClash.active?`${baseReason} Además, es tu día de choque personal: ${reading.personalClash.title}.`:baseReason
  return {date:key,state,reading,reason}
}

export function searchActivityYear(chart:Chart,year:number,activity:ActivityKey){
  const out:ActivityResult[]=[]
  for(let month=1;month<=12;month++)for(let day=1;day<=new Date(Date.UTC(year,month,0)).getUTCDate();day++)out.push(classifyActivity(chart,dateKey(year,month,day),activity))
  return out
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

export type CycleItem={startDate:string;endDate:string;startYear:number;endYear:number;startAge:number;endAge:number;pillar:Pillar;current:boolean;title:string;body:string;focus:string}
export type InitialCycleStage={startDate:string;endDate:string;startYear:number;endYear:number;startAge:0;endAge:number}
function completedAge(birthKey:string,targetKey:string){
  const birth=partsFromKey(birthKey),target=partsFromKey(targetKey)
  let age=target.year-birth.year
  if(target.month<birth.month||(target.month===birth.month&&target.day<birth.day))age--
  return Math.max(0,age)
}
function safeDateKey(year:number,month:number,day:number){
  const last=new Date(Date.UTC(year,month,0)).getUTCDate()
  return dateKey(year,month,Math.min(day,last))
}
export function cycleReading(chart:Chart,sex:'female'|'male',today=new Date()):{startAge:number;startDate:string;initial:InitialCycleStage;items:CycleItem[];current:CycleItem}{
  const p=partsFromKey(chart.birth.calculationDate),[hour,minute]=chart.birth.calculationTime.split(':').map(Number)
  const eightChar=Solar.fromYmdHms(p.year,p.month,p.day,hour,minute,0).getLunar().getEightChar()
  const yun=eightChar.getYun(sex==='male'?1:0),startSolar=yun.getStartSolar(),startMonth=startSolar.getMonth(),startDay=startSolar.getDay()
  const daYun=yun.getDaYun(10).filter((item:any)=>item.getIndex()>0),todayKey=dateKey(today.getFullYear(),today.getMonth()+1,today.getDate())
  const items=daYun.map((item:any)=>{
    const value=String(item.getGanZhi()),stem=stemFromHan[value.charAt(0)],branch=branchFromHan[value.charAt(1)],pillar={stem,branch,hidden:branches[branch].hidden}
    const startDate=safeDateKey(item.getStartYear(),startMonth,startDay),endDate=shiftDate(safeDateKey(item.getStartYear()+10,startMonth,startDay),-1)
    const area=areaFor(chart.dayMaster.element,stems[stem].element),current=todayKey>=startDate&&todayKey<=endDate
    return {startDate,endDate,startYear:partsFromKey(startDate).year,endYear:partsFromKey(endDate).year,startAge:completedAge(chart.birth.calculationDate,startDate),endAge:completedAge(chart.birth.calculationDate,endDate),pillar,current,title:`${identityMeta[stem].name} · ${branches[branch].label}`,body:`${identityMeta[stem].body} ${branchPace[branch]}`,focus:area.title} as CycleItem
  })
  const first=items[0],initialEnd=shiftDate(first.startDate,-1),initial:InitialCycleStage={startDate:chart.birth.calculationDate,endDate:initialEnd,startYear:p.year,endYear:partsFromKey(initialEnd).year,startAge:0,endAge:completedAge(chart.birth.calculationDate,initialEnd)}
  return {startAge:first.startAge,startDate:first.startDate,initial,items,current:items.find((item:CycleItem)=>item.current)||first}
}

export function elementForPillar(pillar:Pillar){return elementMeta[stems[pillar.stem].element]}
