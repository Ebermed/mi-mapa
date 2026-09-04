export type View='home'|'form'|'stories'|'reading'|'pro'|'today'|'calendar'|'month'|'cycles'|'admin'|'studio'
export type ReadingSection='perfiles'|'elementos'|'acciones'|'encuentros'|'vacio'|'ahora'|'carta-completa'
export type AppRoute={view:View;section?:ReadingSection}

export const viewPaths:Record<View,string>={
  home:'/',form:'/crear',stories:'/historias',reading:'/yo',pro:'/carta-pro',today:'/hoy',calendar:'/calendario',month:'/mes',cycles:'/ciclos',admin:'/admin',studio:'/estudio-7m3p',
}

export const sectionPaths:Record<ReadingSection,string>={
  perfiles:'/perfiles',elementos:'/elementos',acciones:'/acciones',encuentros:'/encuentros',vacio:'/vacio',ahora:'/ahora','carta-completa':'/carta',
}

const pathRoutes:Record<string,AppRoute>={
  '/':{view:'home'},
  '/crear':{view:'form'},
  '/historias':{view:'stories'},
  '/yo':{view:'reading'},
  '/carta-pro':{view:'pro'},
  '/hoy':{view:'today'},
  '/calendario':{view:'calendar'},
  '/mes':{view:'month'},
  '/ciclos':{view:'cycles'},
  '/admin':{view:'admin'},
  '/estudio-7m3p':{view:'studio'},
  ...Object.fromEntries(Object.entries(sectionPaths).map(([section,path])=>[path,{view:'reading',section:section as ReadingSection}])),
}

const legacyViews:Record<string,string>={hoy:'/hoy',calendario:'/calendario',mes:'/mes',ciclos:'/ciclos',carta:'/yo','estudio-7m3p':'/estudio-7m3p'}
const hashSections:Record<string,ReadingSection>={
  '#perfiles':'perfiles','#elementos':'elementos','#acciones':'acciones','#encuentros':'encuentros','#vacio':'vacio','#ahora':'ahora','#carta-completa':'carta-completa',
}

function normalizePath(pathname:string){
  const value=pathname.replace(/\/+$/,'')
  return value||'/'
}

export function routeFromLocation(pathname:string,hash=''):AppRoute{
  if(hash==='#estudio-7m3p')return{view:'studio'}
  const route=pathRoutes[normalizePath(pathname)]||{view:'home'}
  const section=hashSections[hash]
  return section&&route.view==='reading'?{view:'reading',section}:route
}

export function pathForRoute(route:AppRoute){
  return route.section?sectionPaths[route.section]:viewPaths[route.view]
}

export function sanitizeLegacyUrl(href:string){
  const url=new URL(href),original=url.toString()
  const legacyView=url.searchParams.get('vista'),hadJourney=url.searchParams.has('c')
  const section=hashSections[url.hash]
  if(section){url.pathname=sectionPaths[section];url.hash=''}
  else if(url.hash==='#estudio-7m3p'){url.pathname=viewPaths.studio;url.hash=''}
  else if(normalizePath(url.pathname)==='/'&&legacyView&&legacyViews[legacyView])url.pathname=legacyViews[legacyView]
  else if(normalizePath(url.pathname)==='/'&&hadJourney)url.pathname=viewPaths.stories
  url.searchParams.delete('c')
  url.searchParams.delete('vista')
  return{url,changed:url.toString()!==original,discardedPrivateData:hadJourney}
}
