import { branches } from '../engine'
import { formatFullDate, generalDayReading } from '../timeEngine'

export type HoyPost = {
  date:string
  title:string
  eyebrow:string
  hook:string
  explanation:string
  curiosity:string
  cta:string
  caption:string
  palette:string
  animal:string
}

const hooks:Record<string,string>={
  Arrancar:'Hoy se presta para empezar eso que llevas posponiendo.',
  Depurar:'Hoy se presta para quitarte pendientes de encima.',
  Consolidar:'Hoy se presta para dejar algo bien amarrado.',
  Reunir:'Hoy se presta para juntar personas, ideas o recursos.',
  Abrir:'Hoy se presta para probar una ruta nueva.',
  Equilibrar:'Hoy se presta para ordenar antes de decidir.',
  Cerrar:'Hoy se presta para ponerle punto final a algo.',
  Recibir:'Hoy se presta para escuchar y dejar que algo llegue.',
  Desmontar:'Hoy se presta para ver qué ya perdió sentido.',
  Riesgo:'Hoy se presta para actuar con un poco más de valentía.',
  Establecer:'Hoy se presta para poner reglas claras.',
  Peligro:'Hoy se presta para dejar espacio y medir mejor el paso.',
}

export function buildHoyPost(date:string):HoyPost{
  const day=generalDayReading(date),animal=branches[day.pillar.branch],hook=hooks[day.rhythm]||`Hoy se presta para ${day.rhythm.toLowerCase()}.`
  const title=`HOY · ${day.rhythm.toUpperCase()}`
  const curiosity=`El calendario usa el ${animal.label} del día para marcar un ritmo colectivo. Tu carta muestra cómo ese ritmo se cruza contigo.`
  const cta='Descubre tu carta completa en MI MAPA. Toda la información y la app son gratis.'
  return {
    date,
    title,
    eyebrow:formatFullDate(date).toUpperCase(),
    hook,
    explanation:day.body,
    curiosity,
    cta,
    palette:animal.element,
    animal:animal.label,
    caption:`${hook}\n\n${day.body}\n\nHoy tiene ritmo de ${day.rhythm.toLowerCase()} y está representado por el ${animal.label}. ${curiosity}\n\n${cta}`,
  }
}
