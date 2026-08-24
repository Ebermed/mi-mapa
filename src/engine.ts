import { Solar } from 'lunar-javascript'

export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type Polarity = 'yang' | 'yin'
export type StemKey = 'jia'|'yi'|'bing'|'ding'|'wu'|'ji'|'geng'|'xin'|'ren'|'gui'
export type BranchKey = 'rat'|'ox'|'tiger'|'rabbit'|'dragon'|'snake'|'horse'|'goat'|'monkey'|'rooster'|'dog'|'pig'
export type PillarKey = 'hour'|'day'|'month'|'year'
export type TenGodKey = 'bi_jian'|'jie_cai'|'shi_shen'|'shang_guan'|'pian_cai'|'zheng_cai'|'qi_sha'|'zheng_guan'|'pian_yin'|'zheng_yin'

export type BirthInput = {
  name?: string
  date: string
  time: string
  timezone: string
  place?: string
  longitude?: number
  /** Conservado sólo para poder abrir enlaces viejos. Las cartas nuevas usan zona histórica + longitud. */
  dstAdjustment?: boolean
}

export type Pillar = { stem: StemKey; branch: BranchKey; hidden: StemKey[] }
export type Interaction = { id: string; kind: string; branches: BranchKey[]; pillars: PillarKey[]; note: string }
export type Chart = {
  birth: BirthInput & { calculationDate: string; calculationTime: string; solarCorrectionMinutes: number; zoneOffset: number }
  pillars: Record<PillarKey, Pillar>
  dayMaster: { stem: StemKey; element: ElementKey; polarity: Polarity; strength: string }
  elements: Record<ElementKey, number>
  tenGods: Record<TenGodKey, number>
  interactions: Interaction[]
  voidBranches: BranchKey[]
  voidPillars: PillarKey[]
  calculation: { status: 'verified_fixture'|'library_unverified'|'fixture_fallback'; note: string }
}

export const stemOrder: StemKey[] = ['jia','yi','bing','ding','wu','ji','geng','xin','ren','gui']
export const branchOrder: BranchKey[] = ['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']

export const stems: Record<StemKey,{ han:string; element:ElementKey; polarity:Polarity; label:string }> = {
  jia:{han:'甲',element:'wood',polarity:'yang',label:'Madera Yang'}, yi:{han:'乙',element:'wood',polarity:'yin',label:'Madera Yin'},
  bing:{han:'丙',element:'fire',polarity:'yang',label:'Fuego Yang'}, ding:{han:'丁',element:'fire',polarity:'yin',label:'Fuego Yin'},
  wu:{han:'戊',element:'earth',polarity:'yang',label:'Tierra Yang'}, ji:{han:'己',element:'earth',polarity:'yin',label:'Tierra Yin'},
  geng:{han:'庚',element:'metal',polarity:'yang',label:'Metal Yang'}, xin:{han:'辛',element:'metal',polarity:'yin',label:'Metal Yin'},
  ren:{han:'壬',element:'water',polarity:'yang',label:'Agua Yang'}, gui:{han:'癸',element:'water',polarity:'yin',label:'Agua Yin'},
}

export const branches: Record<BranchKey,{ han:string; label:string; hidden:StemKey[]; element:ElementKey }> = {
  rat:{han:'子',label:'Rata',hidden:['gui'],element:'water'}, ox:{han:'丑',label:'Buey',hidden:['ji','gui','xin'],element:'earth'},
  tiger:{han:'寅',label:'Tigre',hidden:['jia','bing','wu'],element:'wood'}, rabbit:{han:'卯',label:'Conejo',hidden:['yi'],element:'wood'},
  dragon:{han:'辰',label:'Dragón',hidden:['wu','yi','gui'],element:'earth'}, snake:{han:'巳',label:'Víbora',hidden:['bing','wu','geng'],element:'fire'},
  horse:{han:'午',label:'Caballo',hidden:['ding','ji'],element:'fire'}, goat:{han:'未',label:'Cabra',hidden:['ji','ding','yi'],element:'earth'},
  monkey:{han:'申',label:'Mono',hidden:['geng','ren','wu'],element:'metal'}, rooster:{han:'酉',label:'Gallo',hidden:['xin'],element:'metal'},
  dog:{han:'戌',label:'Perro',hidden:['wu','xin','ding'],element:'earth'}, pig:{han:'亥',label:'Cerdo',hidden:['ren','jia'],element:'water'},
}

const hanStem = Object.fromEntries(Object.entries(stems).map(([key,value]) => [value.han,key])) as Record<string,StemKey>
const hanBranch = Object.fromEntries(Object.entries(branches).map(([key,value]) => [value.han,key])) as Record<string,BranchKey>

export const elementMeta: Record<ElementKey,{ label:string; article:string; color:string; dark:string; soft:string; sentence:string }> = {
  wood:{label:'Madera',article:'la madera',color:'#71845d',dark:'#3f5841',soft:'#dce7d4',sentence:'Te ayuda a empezar, adaptarte y hacer crecer lo que importa.'},
  fire:{label:'Fuego',article:'el fuego',color:'#d4774c',dark:'#8f422d',soft:'#f6d9c9',sentence:'Te ayuda a encender el movimiento y volver visible lo que importa.'},
  earth:{label:'Tierra',article:'la tierra',color:'#b58b55',dark:'#735535',soft:'#ebddc5',sentence:'Te ayuda a sostener procesos, personas y responsabilidades.'},
  metal:{label:'Metal',article:'el metal',color:'#8b8d8a',dark:'#555b5e',soft:'#e4e4e1',sentence:'Te ayuda a elegir, ordenar y poner límites claros.'},
  water:{label:'Agua',article:'el agua',color:'#6f91a2',dark:'#355d71',soft:'#d5e4e8',sentence:'Te ayuda a observar, conectar información y encontrar otra ruta.'},
}

export const identityMeta: Record<StemKey,{ name:string; caption:string; headline:string; body:string; friction:string }> = {
  jia:{name:'Roble',caption:'dirección y constancia',headline:'Cuando eliges una dirección, no la abandonas a la primera dificultad.',body:'Te sale avanzar con una idea clara de hacia dónde quieres ir y seguir empujando mientras todavía tenga sentido.',friction:'A veces tardas en revisar el rumbo porque ya invertiste mucho en sostenerlo.'},
  yi:{name:'Hiedra',caption:'adaptación y estrategia',headline:'Puedes cambiar la forma de llegar sin perder de vista lo que querías conseguir.',body:'Adaptarte te sale como estrategia: miras qué hay disponible, encuentras margen y ajustas la ruta.',friction:'Adaptarte tanto puede hacer que otros tarden en notar dónde están tus límites.'},
  bing:{name:'Sol',caption:'impulso y presencia',headline:'Cuando algo te entusiasma, se te nota y puedes contagiar ese impulso.',body:'Te sale poner energía visible en lo que quieres mover y ayudar a que algo arranque.',friction:'Puedes mantener el acelerador puesto cuando ya convendría bajar el ritmo.'},
  ding:{name:'Brasa',caption:'detalle y continuidad',headline:'Sueles arrancar mejor cuando ya entendiste cómo quieres hacer las cosas.',body:'Te sirve preparar, cuidar detalles y construir confianza antes de exponerte del todo.',friction:'Puedes esperar demasiado a sentir que todo está listo.'},
  wu:{name:'Montaña',caption:'estabilidad y sostén',headline:'Cuando te comprometes con algo, tiendes a sostenerlo hasta encontrar cómo hacerlo funcionar.',body:'La constancia aparece con facilidad cuando sientes que algo vale la pena o depende de ti.',friction:'Puedes terminar cargando mucho más de lo que te toca.'},
  ji:{name:'Huerto',caption:'cuidado y mantenimiento',headline:'Detectas rápido los cuidados pequeños que mantienen algo funcionando.',body:'Te sale planear, mantener y ajustar sobre la marcha para que lo importante siga creciendo.',friction:'Puedes ocuparte tanto de lo demás que termines postergando lo tuyo.'},
  geng:{name:'Acero',caption:'decisión y firmeza',headline:'Cuando ya sabes qué sobra, te resulta natural cortarlo y seguir.',body:'Bajo presión puedes volverte muy directo para decidir qué sirve, qué estorba y qué toca hacer.',friction:'Puedes cerrar una opción antes de escuchar algo que habría cambiado la decisión.'},
  xin:{name:'Joya',caption:'precisión y criterio',headline:'Sueles notar detalles que otras personas dejan pasar.',body:'Antes de dar algo por terminado, revisas la forma, la precisión y si cada parte quedó como querías.',friction:'Puedes seguir corrigiendo cuando el resultado ya funciona.'},
  ren:{name:'Marea',caption:'movimiento y conexión',headline:'Cuando aparece un problema, tu cabeza abre varias rutas a la vez.',body:'Te sale conectar información, personas y opciones mientras sigues avanzando.',friction:'Puedes abrir más frentes de los que alcanzas a cerrar.'},
  gui:{name:'Rocío',caption:'contexto e imaginación',headline:'Sueles encontrar salidas que no eran la ruta más obvia.',body:'Lees el contexto, conectas señales pequeñas y cambias de enfoque cuando aparece información nueva.',friction:'Puedes seguir explorando posibilidades cuando ya necesitas escoger una.'},
}

export const pillarMeta: Record<PillarKey,{ title:string; eyebrow:string; intro:string }> = {
  hour:{title:'Qué estás construyendo',eyebrow:'Tu hora',intro:'Habla de tu mundo interior, tus proyectos y la huella que quieres dejar.'},
  day:{title:'Tu centro',eyebrow:'Tu día',intro:'Aquí vive tu Día Maestro: tu referencia más personal y la forma en que te vinculas de cerca.'},
  month:{title:'Cómo avanzas',eyebrow:'Tu mes',intro:'Muestra cómo entras al trabajo, los retos y los espacios donde quieres hacerte un lugar.'},
  year:{title:'De dónde vienes',eyebrow:'Tu año',intro:'Cuenta el clima de origen: lo aprendido temprano y la forma en que te lee el mundo al conocerte.'},
}

export const branchPace: Record<BranchKey,string> = {
  rat:'Primero observas por dónde se mueve la situación y luego encuentras una entrada.', ox:'Prefieres avanzar paso a paso y confiar en lo que ya demostró que funciona.',
  tiger:'Te activa abrir camino y probar con movimiento, incluso antes de tener todo resuelto.', rabbit:'Lees el ambiente y ajustas el tono para que las cosas puedan seguir sin romperse.',
  dragon:'Tiendes a juntar varias piezas, proteger tu espacio y reorganizar hasta que algo tenga estructura.', snake:'Miras con atención antes de moverte; cuando ves el momento, puedes actuar con mucha precisión.',
  horse:'Necesitas movimiento visible y margen para actuar con rapidez.', goat:'Te importa que el proceso se sostenga y que las personas dentro de él tengan espacio.',
  monkey:'Encuentras atajos, pruebas recursos distintos y aprendes mientras resuelves.', rooster:'Notas qué no encaja y te sale afinarlo hasta que quede claro.',
  dog:'La lealtad y el sentido de responsabilidad pesan mucho cuando decides quedarte.', pig:'Absorbes información con facilidad y prefieres comprender el contexto antes de cerrar una conclusión.',
}

const generatedBy: Record<ElementKey,ElementKey> = {wood:'water',fire:'wood',earth:'fire',metal:'earth',water:'metal'}
const generates: Record<ElementKey,ElementKey> = {wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood'}
const controls: Record<ElementKey,ElementKey> = {wood:'earth',earth:'water',water:'fire',fire:'metal',metal:'wood'}

function tenGod(day:StemKey,target:StemKey):TenGodKey {
  const d=stems[day],t=stems[target],same=d.polarity===t.polarity
  if(d.element===t.element) return same?'bi_jian':'jie_cai'
  if(generates[d.element]===t.element) return same?'shi_shen':'shang_guan'
  if(controls[d.element]===t.element) return same?'pian_cai':'zheng_cai'
  if(controls[t.element]===d.element) return same?'qi_sha':'zheng_guan'
  if(generatedBy[d.element]===t.element) return same?'pian_yin':'zheng_yin'
  return 'bi_jian'
}

function shiftHour(time:string,delta:number){
  const [h,m]=time.split(':').map(Number), total=(h*60+m+delta*60+1440)%1440
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

function zoneParts(timestamp:number,timezone:string){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(timestamp))
  return Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)])) as Record<'year'|'month'|'day'|'hour'|'minute'|'second',number>
}

function zoneOffsetAt(timestamp:number,timezone:string){
  const p=zoneParts(timestamp,timezone)
  return (Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-timestamp)/3_600_000
}

function utcFromLocal(date:string,time:string,timezone:string){
  const [year,month,day]=date.split('-').map(Number),[hour,minute]=time.split(':').map(Number)
  const localClock=Date.UTC(year,month-1,day,hour,minute,0)
  let timestamp=localClock
  for(let i=0;i<4;i++) timestamp=localClock-zoneOffsetAt(timestamp,timezone)*3_600_000
  return timestamp
}

function solarMoment(input:BirthInput){
  const [year,month,day]=input.date.split('-').map(Number),[hour,minute]=input.time.split(':').map(Number)
  if(!Number.isFinite(input.longitude)){
    return {date:input.date,time:input.dstAdjustment?shiftHour(input.time,-1):input.time,correction:input.dstAdjustment?-60:0,offset:zoneOffsetAt(utcFromLocal(input.date,input.time,input.timezone),input.timezone)}
  }
  const timestamp=utcFromLocal(input.date,input.time,input.timezone)
  const offset=zoneOffsetAt(timestamp,input.timezone)
  const julian=timestamp/86_400_000+2440587.5
  const radians=Math.PI/180
  const n=julian-2451545
  const g=(357.528+0.9856003*n)*radians
  const lambda=(280.46+0.9856474*n)*radians
  const equation=-7.655*Math.sin(g)+9.873*Math.sin(2*lambda+3.588)
  const longitudeCorrection=(input.longitude!-offset*15)*4
  const correction=longitudeCorrection+equation
  const adjusted=new Date(Date.UTC(year,month-1,day,hour,minute)+correction*60_000)
  const pad=(value:number)=>String(value).padStart(2,'0')
  return {
    date:`${adjusted.getUTCFullYear()}-${pad(adjusted.getUTCMonth()+1)}-${pad(adjusted.getUTCDate())}`,
    time:`${pad(adjusted.getUTCHours())}:${pad(adjusted.getUTCMinutes())}`,
    correction,
    offset,
  }
}

function libraryPillars(date:string,time:string):Record<PillarKey,Pillar>{
  const [y,m,d]=date.split('-').map(Number),[hh,mm]=time.split(':').map(Number)
  const ec=Solar.fromYmdHms(y,m,d,hh,mm,0).getLunar().getEightChar()
  const pillar=(gan:string,zhi:string):Pillar=>{
    const stem=hanStem[gan],branch=hanBranch[zhi]
    if(!stem||!branch) throw new Error(`Pilar no reconocido: ${gan}${zhi}`)
    return {stem,branch,hidden:branches[branch].hidden}
  }
  return {year:pillar(ec.getYearGan(),ec.getYearZhi()),month:pillar(ec.getMonthGan(),ec.getMonthZhi()),day:pillar(ec.getDayGan(),ec.getDayZhi()),hour:pillar(ec.getTimeGan(),ec.getTimeZhi())}
}

const fixtureDefs = {
  eber:{date:'1996-07-20',time:'11:45',pillars:{year:['bing','rat'],month:['yi','goat'],day:['wu','horse'],hour:['ding','snake']},strength:'Fuerte'},
  anju:{date:'2000-04-27',time:'02:00',pillars:{year:['geng','dragon'],month:['geng','dragon'],day:['yi','rabbit'],hour:['ding','ox']},strength:'Próspero'},
} as const

export const fixtures:Record<'eber'|'anju',BirthInput>={
  eber:{name:'Eber',date:'1996-07-20',time:'11:45',timezone:'America/Mexico_City',place:'León, Guanajuato, México',longitude:-101.68},
  anju:{name:'Anju',date:'2000-04-27',time:'02:00',timezone:'America/Mexico_City',place:'Ciudad de México, México',longitude:-99.13},
}

function detectInteractions(p:Record<PillarKey,Pillar>):Interaction[]{
  const entries=Object.entries(p) as [PillarKey,Pillar][], out:Interaction[]=[]
  const sets:{kind:string;pairs:[BranchKey,BranchKey][]}[]=[
    {kind:'armonía',pairs:[['rat','ox'],['tiger','pig'],['rabbit','dog'],['dragon','rooster'],['snake','monkey'],['horse','goat']]},
    {kind:'choque',pairs:[['rat','horse'],['ox','goat'],['tiger','monkey'],['rabbit','rooster'],['dragon','dog'],['snake','pig']]},
    {kind:'tensión',pairs:[['rat','goat'],['ox','horse'],['tiger','snake'],['rabbit','dragon'],['rooster','dog'],['monkey','pig']]},
  ]
  for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++){
    const [pa,a]=entries[i],[pb,b]=entries[j]
    for(const set of sets) if(set.pairs.some(([x,y])=>(a.branch===x&&b.branch===y)||(a.branch===y&&b.branch===x))) out.push({id:`${set.kind}-${pa}-${pb}`,kind:set.kind,branches:[a.branch,b.branch],pillars:[pa,pb],note:`${branches[a.branch].label} + ${branches[b.branch].label}`})
    if(a.branch===b.branch&&['dragon','horse','rooster','pig'].includes(a.branch)) out.push({id:`eco-${a.branch}-${pa}-${pb}`,kind:'eco interno',branches:[a.branch,b.branch],pillars:[pa,pb],note:`${branches[a.branch].label} se repite`})
  }
  const present=entries.map(([,x])=>x.branch)
  const triples:[BranchKey[],string][]=[[["tiger","horse","dog"],'armonía de fuego'],[["pig","rabbit","goat"],'armonía de madera'],[["monkey","rat","dragon"],'armonía de agua'],[["snake","rooster","ox"],'armonía de metal']]
  for(const [set,note] of triples) if(set.every(x=>present.includes(x))) out.push({id:note,kind:'armonía triple',branches:set,pillars:entries.filter(([,x])=>set.includes(x.branch)).map(([k])=>k),note})
  return out
}

function voidFor(day:Pillar){
  const stemIndex=stemOrder.indexOf(day.stem),branchIndex=branchOrder.indexOf(day.branch)
  const start=(branchIndex-stemIndex+12)%12
  return [branchOrder[(start+10)%12],branchOrder[(start+11)%12]]
}

export function calculateChart(input:BirthInput):Chart{
  const fixture=input.date===fixtureDefs.eber.date&&input.time===fixtureDefs.eber.time?'eber':input.date===fixtureDefs.anju.date&&input.time===fixtureDefs.anju.time?'anju':null
  const solar=solarMoment(input)
  let pillars:Record<PillarKey,Pillar>|null=null, note='Zona horaria histórica y hora solar calculadas en este dispositivo.'
  try{pillars=libraryPillars(solar.date,solar.time)}catch{note='No se pudo leer el calendario local.'}
  let status:Chart['calculation']['status']='library_unverified',strength='Por observar'
  if(fixture){
    const def=fixtureDefs[fixture]
    const expected=Object.fromEntries(Object.entries(def.pillars).map(([key,value])=>{
      const branch=value[1] as BranchKey
      return [key,{stem:value[0] as StemKey,branch,hidden:branches[branch].hidden}]
    })) as Record<PillarKey,Pillar>
    const matches=pillars&&(['year','month','day','hour'] as PillarKey[]).every(k=>pillars![k].stem===expected[k].stem&&pillars![k].branch===expected[k].branch)
    pillars=matches?pillars:expected; status=matches?'verified_fixture':'fixture_fallback'; strength=def.strength
    note=matches?'Coincide con la carta de referencia.':'Se conservó la carta de referencia validada.'
  }
  if(!pillars) throw new Error('No pudimos calcular tu carta. Revisa la fecha y la hora.')
  const day=pillars.day.stem,elements={wood:0,fire:0,earth:0,metal:0,water:0} as Record<ElementKey,number>
  const tenGods={bi_jian:0,jie_cai:0,shi_shen:0,shang_guan:0,pian_cai:0,zheng_cai:0,qi_sha:0,zheng_guan:0,pian_yin:0,zheng_yin:0} as Record<TenGodKey,number>
  for(const [key,p] of Object.entries(pillars) as [PillarKey,Pillar][]){
    elements[stems[p.stem].element]+=2
    if(key!=='day') tenGods[tenGod(day,p.stem)]+=2
    p.hidden.forEach(hidden=>{elements[stems[hidden].element]+=1;tenGods[tenGod(day,hidden)]+=1})
  }
  const voidBranches=voidFor(pillars.day),voidPillars=(Object.entries(pillars) as [PillarKey,Pillar][]).filter(([,p])=>voidBranches.includes(p.branch)).map(([key])=>key)
  return {birth:{...input,calculationDate:solar.date,calculationTime:solar.time,solarCorrectionMinutes:solar.correction,zoneOffset:solar.offset},pillars,dayMaster:{stem:day,element:stems[day].element,polarity:stems[day].polarity,strength},elements,tenGods,interactions:detectInteractions(pillars),voidBranches,voidPillars,calculation:{status,note}}
}

export function pillarReading(key:PillarKey,pillar:Pillar){
  const identity=identityMeta[pillar.stem],place=pillarMeta[key]
  return {headline:place.title,body:`${identity.body} ${branchPace[pillar.branch]}`,friction:identity.friction}
}

export function strongestElement(chart:Chart){return (Object.entries(chart.elements) as [ElementKey,number][]).sort((a,b)=>b[1]-a[1])[0]}
export function lowestElement(chart:Chart){return (Object.entries(chart.elements) as [ElementKey,number][]).sort((a,b)=>a[1]-b[1])[0]}
export function pillarLabel(p:Pillar){return `${stems[p.stem].label} · ${branches[p.branch].label}`}

export function interactionReading(interaction:Interaction){
  const places=interaction.pillars.map(p=>pillarMeta[p].title.toLowerCase()).join(' y ')
  if(interaction.kind==='armonía'||interaction.kind==='armonía triple') return {title:'Hay partes de ti que se hacen equipo',body:`Entre ${places} hay una armonía: cuando una de esas áreas se activa, la otra suele encontrar cómo acompañarla. No significa que todo sea fácil; significa que existe un puente natural entre ambas.`}
  if(interaction.kind==='choque') return {title:'Dos ritmos tuyos piden cosas distintas',body:`Entre ${places} aparece un choque. Puede sentirse como cambiar de prioridad de golpe o querer avanzar de dos maneras incompatibles. No es una condena: es una señal para nombrar qué necesidad toca primero.`}
  if(interaction.kind==='eco interno') return {title:'Un mismo patrón se repite con fuerza',body:`La misma energía aparece en ${places}. Cuando se activa, puede volverse muy evidente. Te sirve ponerle nombre temprano para no reaccionar en automático.`}
  return {title:'Hay una fricción que conviene mirar de frente',body:`Entre ${places} puede acumularse incomodidad antes de que la expreses. Cuando notes que algo te pesa, decir qué necesitas suele ser más útil que seguir ajustándote en silencio.`}
}

export function voidReading(chart:Chart){
  const names=chart.voidBranches.map(x=>branches[x].label).join(' y ')
  if(!chart.voidPillars.length) return {title:'Tu vacío no ocupa un pilar natal',body:`Tu ciclo deja en vacío a ${names}, pero ninguna de esas ramas aparece en tus cuatro pilares. Puede sentirse de forma temporal cuando una etapa o una fecha las activa, no como un tema fijo de tu carta.`}
  const places=chart.voidPillars.map(x=>pillarMeta[x].title.toLowerCase()).join(' y ')
  return {title:`El vacío toca ${places}`,body:`Aquí el vacío no significa que te falte algo. Señala un área que rara vez se sostiene en piloto automático: necesitas comprobarla en experiencia propia, redefinirla o construir una manera muy tuya de vivirla. Técnicamente, tus ramas vacías son ${names}.`}
}

export function profileSummary(chart:Chart){
  const identity=identityMeta[chart.dayMaster.stem],strong=strongestElement(chart)[0],low=lowestElement(chart)[0]
  return `${identity.headline} ${elementMeta[strong].article.charAt(0).toUpperCase()+elementMeta[strong].article.slice(1)} es tu recurso más disponible; ${elementMeta[low].article} te pide más intención.`
}

