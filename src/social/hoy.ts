import { branches, type BranchKey } from '../engine'
import { formatFullDate, generalDayReading } from '../timeEngine'

export type HoyPost = {
  date:string
  title:string
  eyebrow:string
  hook:string
  displayHook:string
  body:string
  explanation:string
  curiosity:string
  cta:string
  caption:string
  palette:string
  animal:string
  animalKey:BranchKey
}

export function buildHoyPost(date:string):HoyPost{
  const day=generalDayReading(date),animal=branches[day.pillar.branch]
  const action=day.rhythm.toUpperCase()
  const hook=`Hoy es un buen día para ${day.rhythm.toLowerCase()}.`
  const curiosity=`El animal del día es ${animal.label}. En tu carta puedes ver cómo esta fecha se relaciona contigo.`
  const cta='Descubre tu carta completa en MI MAPA. Toda la información y la app son gratis.'
  return {
    date,
    title:`HOY · ${action}`,
    eyebrow:formatFullDate(date).toUpperCase(),
    hook,
    displayHook:action,
    body:day.body,
    explanation:day.body,
    curiosity,
    cta,
    palette:animal.element,
    animal:animal.label,
    animalKey:day.pillar.branch,
    caption:`${hook}\n\n${day.body}\n\n${curiosity}\n\n${cta}`,
  }
}
