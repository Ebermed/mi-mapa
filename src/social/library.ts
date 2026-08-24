import { branches, stems, type BranchKey, type StemKey } from '../engine'
import { generalDayReading } from '../timeEngine'

const CTA='Descubre tu carta completa en MI MAPA. Toda la información y la app son gratis.'
const centers:Record<StemKey,{hook:string;body:string}>={
  jia:{hook:'¿Eres de quien empieza antes de tener todo resuelto?',body:'Cuando ves una posibilidad, te dan ganas de moverla y sostenerla hasta que avance.'},
  yi:{hook:'¿Detectas rápido cómo ajustar algo para que funcione?',body:'Encuentras rutas alternas y sabes adaptarte mientras conservas lo que te importa.'},
  bing:{hook:'¿Cuando algo te emociona se te nota en toda la cara?',body:'Enciendes ideas y haces que otras personas quieran mirar hacia ahí.'},
  ding:{hook:'¿Te prende más una conversación buena que hacer ruido?',body:'Prefieres profundizar, preparar y cuidar detalles antes de mostrarte por completo.'},
  wu:{hook:'¿Terminas siendo quien sostiene el plan?',body:'Buscas que las cosas aterricen y que la gente tenga dónde apoyarse.'},
  ji:{hook:'¿Piensas primero en qué necesita cada quien?',body:'Detectas los cuidados pequeños que mantienen un proceso funcionando.'},
  geng:{hook:'¿Ves el problema y ya quieres resolverlo?',body:'Cortas lo que estorba y actúas cuando el momento pide decisión.'},
  xin:{hook:'¿Te cuesta ignorar algo que podría quedar mucho mejor?',body:'Afinas, ordenas y elevas el estándar de lo que pasa por tus manos.'},
  ren:{hook:'¿Antes de hablar ya conectaste varias piezas?',body:'Juntas información y encuentras salidas que otras personas todavía pasan por alto.'},
  gui:{hook:'¿Guardas detalles que luego resultan claves?',body:'Lees el ambiente y captas señales pequeñas antes de que todo se haga evidente.'},
}

const animalCopy:Record<BranchKey,{hook:string;body:string;baseYear:number}>={
  rat:{hook:'¿Siempre ubicas por dónde conviene entrar?',body:'La Rata observa, calcula y encuentra recursos donde otras personas ven poco.',baseYear:1960},
  ox:{hook:'¿Te desespera que cambien el plan a media ruta?',body:'El Buey avanza a su ritmo, cumple y prefiere que las cosas tengan base.',baseYear:1961},
  tiger:{hook:'¿Te animas más cuando algo parece difícil?',body:'El Tigre entra con fuerza, protege lo suyo y disfruta un reto que vale la pena.',baseYear:1962},
  rabbit:{hook:'¿Lees el ambiente antes de decir algo?',body:'El Conejo cuida el tono, el espacio y las relaciones antes de moverse.',baseYear:1963},
  dragon:{hook:'¿Llegas a una reunión y de pronto todo se mueve?',body:'El Dragón junta presencia, ambición y ganas de construir algo que se note.',baseYear:1964},
  snake:{hook:'¿Prefieres entender bien antes de mostrar tus cartas?',body:'La Víbora observa de cerca, elige su momento y detecta lo que falta.',baseYear:1965},
  horse:{hook:'¿Te pesa sentir que estás estancado?',body:'El Caballo necesita movimiento, experiencias y una ruta propia.',baseYear:1966},
  goat:{hook:'¿Te importa que un lugar se sienta bien para todos?',body:'La Cabra aporta sensibilidad, gusto y una forma de cuidar que une al grupo.',baseYear:1967},
  monkey:{hook:'¿Ante un problema ya pensaste tres formas de resolverlo?',body:'El Mono aprende rápido, prueba y disfruta encontrar una salida ingeniosa.',baseYear:1968},
  rooster:{hook:'¿Ves rápido qué sobra y qué falta?',body:'El Gallo ordena, afina y dice lo necesario cuando algo necesita claridad.',baseYear:1969},
  dog:{hook:'¿Te tomas muy en serio a tu gente?',body:'El Perro valora la lealtad, detecta incoherencias y defiende lo que considera justo.',baseYear:1970},
  pig:{hook:'¿La gente termina contándote cosas apenas te conoce?',body:'El Cerdo crea confianza, disfruta lo bueno y abre espacio para los demás.',baseYear:1971},
}

function yearsFor(baseYear:number){const years:number[]=[];for(let year=baseYear-12;year<=2031;year+=12)years.push(year);return years}

export function buildCenterPost(stem:StemKey){
  const center=centers[stem],meta=stems[stem]
  return {title:`TU CENTRO: ${meta.label.toUpperCase()}`,hook:center.hook,body:center.body,palette:meta.element,cta:CTA,caption:`${center.hook}\n\n${center.body}\n\nEn MI MAPA le llamamos tu centro: la forma en que vuelves a ti para decidir.\n\n${CTA}`}
}

export function buildAnimalPost(animal:BranchKey){
  const item=animalCopy[animal],meta=branches[animal],years=yearsFor(item.baseYear)
  return {title:`SI ERES ${meta.label.toUpperCase()}`,hook:item.hook,body:item.body,years:years.join(' · '),palette:meta.element,cta:CTA,caption:`${item.hook}\n\n${item.body}\n\nAños: ${years.join(', ')}. Quienes nacieron entre enero y los primeros días de febrero pueden cambiar de animal según su fecha exacta.\n\n${CTA}`}
}

const clashes:Record<BranchKey,BranchKey>={rat:'horse',ox:'goat',tiger:'monkey',rabbit:'rooster',dragon:'dog',snake:'pig',horse:'rat',goat:'ox',monkey:'tiger',rooster:'rabbit',dog:'dragon',pig:'snake'}
const animalOrder:BranchKey[]=['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']

export function buildWeeklyAnimalCarousel(startDate:string){
  const day=generalDayReading(startDate)
  return animalOrder.map(animal=>{
    const meta=branches[animal],item=animalCopy[animal],years=yearsFor(item.baseYear),match=animal===day.pillar.branch,clash=clashes[animal]===day.pillar.branch
    const focus=match?'El ritmo de la semana te queda cerca: úsalo en una prioridad concreta.':clash?'Esta semana pide margen antes de responder o cerrar algo.':'La semana se presta para elegir una prioridad y moverla paso a paso.'
    return {animal:meta.label,years:years.join(' · '),title:`SEMANA PARA ${meta.label.toUpperCase()}`,focus,palette:meta.element,cta:CTA}
  })
}
