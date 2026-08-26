import { branches, stems, type BranchKey, type StemKey } from '../engine'
import { generalDayReading } from '../timeEngine'

const CTA='Descubre tu carta completa gratis en mi-mapa.github.io.'
const centers:Record<StemKey,{hook:string;body:string}>={
  jia:{hook:'¿Empiezas antes de tener todo resuelto?',body:'Cuando ves una posibilidad, empiezas pronto y ajustas el plan mientras avanzas.'},
  yi:{hook:'¿Encuentras otra forma cuando el plan falla?',body:'Comparas opciones y pruebas otra forma de conseguir lo que querías.'},
  bing:{hook:'¿Se te nota cuando algo te emociona?',body:'Propones ideas y animas a otras personas a participar.'},
  ding:{hook:'¿Prefieres entender bien antes de mostrar lo que haces?',body:'Preparas, investigas y cuidas los detalles antes de presentar tu trabajo.'},
  wu:{hook:'¿Terminas organizando el plan de todos?',body:'Cuando una tarea depende de ti, la organizas y le das seguimiento hasta terminarla.'},
  ji:{hook:'¿Detectas qué necesita cada persona?',body:'Notas los cuidados pequeños que mantienen una tarea funcionando.'},
  geng:{hook:'¿Ves el problema y quieres resolverlo ya?',body:'Decides qué sirve, qué estorba y qué toca hacer.'},
  xin:{hook:'¿Notas enseguida lo que podría quedar mejor?',body:'Revisas, ordenas y corriges los detalles antes de dar algo por terminado.'},
  ren:{hook:'¿Piensas en varias soluciones al mismo tiempo?',body:'Relacionas información y consideras varias opciones antes de decidir.'},
  gui:{hook:'¿Guardas detalles que después resultan clave?',body:'Observas el contexto y notas información pequeña antes que otras personas.'},
}

const animalCopy:Record<BranchKey,{hook:string;body:string;baseYear:number}>={
  rat:{hook:'¿Detectas recursos que otros pasan por alto?',body:'La Rata observa, compara y aprovecha lo que tiene disponible.',baseYear:1960},
  ox:{hook:'¿Prefieres que los planes cambien con aviso?',body:'El Buey trabaja con constancia, cumple y prefiere planes claros.',baseYear:1961},
  tiger:{hook:'¿Empiezas aunque falten algunos detalles?',body:'El Tigre toma iniciativa, protege lo suyo y disfruta resolver retos.',baseYear:1962},
  rabbit:{hook:'¿Observas las reacciones antes de hablar?',body:'El Conejo cuida sus palabras y considera cómo se sienten otras personas.',baseYear:1963},
  dragon:{hook:'¿Llegas y propones cambios?',body:'El Dragón toma iniciativa, plantea mejoras y busca resultados visibles.',baseYear:1964},
  snake:{hook:'¿Prefieres entender antes de contar tus planes?',body:'La Víbora observa, elige cuándo actuar y detecta lo que falta.',baseYear:1965},
  horse:{hook:'¿Te cuesta pasar mucho tiempo sin hacer nada?',body:'El Caballo prefiere mantenerse activo, vivir experiencias y decidir su propio plan.',baseYear:1966},
  goat:{hook:'¿Notas cuando alguien se siente incómodo?',body:'La Cabra cuida los detalles, la convivencia y las necesidades del grupo.',baseYear:1967},
  monkey:{hook:'¿Ante un problema ya imaginaste tres soluciones?',body:'El Mono aprende rápido, prueba opciones y disfruta resolver problemas.',baseYear:1968},
  rooster:{hook:'¿Ves rápido qué sobra y qué falta?',body:'El Gallo ordena, revisa y dice lo necesario cuando algo necesita claridad.',baseYear:1969},
  dog:{hook:'¿Te tomas muy en serio a tu gente?',body:'El Perro valora la lealtad, detecta incoherencias y defiende lo que considera justo.',baseYear:1970},
  pig:{hook:'¿La gente termina contándote todo?',body:'El Cerdo escucha, genera confianza y hace que otras personas se sientan tomadas en cuenta.',baseYear:1971},
}

function yearsFor(baseYear:number){const years:number[]=[];for(let year=baseYear-12;year<=2031;year+=12)years.push(year);return years}

export function buildCenterPost(stem:StemKey){
  const center=centers[stem],meta=stems[stem]
  return {title:`TU CENTRO: ${meta.label.toUpperCase()}`,hook:center.hook,body:center.body,palette:meta.element,cta:CTA,caption:`${center.hook}\n\n${center.body}\n\nEn MI MAPA le llamamos tu centro: cómo sueles tomar decisiones personales.\n\n${CTA}`}
}

export function buildAnimalPost(animal:BranchKey){
  const item=animalCopy[animal],meta=branches[animal],years=yearsFor(item.baseYear)
  return {title:`SI ERES ${meta.label.toUpperCase()}`,hook:item.hook,body:item.body,years:years.join(' · '),palette:meta.element,animalKey:animal,cta:CTA,caption:`${item.hook}\n\n${item.body}\n\nAños: ${years.join(', ')}. Quienes nacieron entre enero y los primeros días de febrero pueden cambiar de animal según su fecha exacta.\n\n${CTA}`}
}

const clashes:Record<BranchKey,BranchKey>={rat:'horse',ox:'goat',tiger:'monkey',rabbit:'rooster',dragon:'dog',snake:'pig',horse:'rat',goat:'ox',monkey:'tiger',rooster:'rabbit',dog:'dragon',pig:'snake'}
const animalOrder:BranchKey[]=['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']

export function buildWeeklyAnimalCarousel(startDate:string){
  const day=generalDayReading(startDate)
  return animalOrder.map(animal=>{
    const meta=branches[animal],item=animalCopy[animal],years=yearsFor(item.baseYear),match=animal===day.pillar.branch,clash=clashes[animal]===day.pillar.branch
    const focus=match?'Esta semana puedes concentrarte en una prioridad y terminarla.':clash?'Esta semana revisa horarios y acuerdos antes de responder o cerrar algo.':'Esta semana elige una prioridad y completa una tarea a la vez.'
    return {animal:meta.label,animalKey:animal,years:years.join(' · '),title:`SEMANA PARA ${meta.label.toUpperCase()}`,focus,palette:meta.element,cta:CTA}
  })
}
