import type { Consultant, DirectoryData, Referral } from './consultants'

const url=String(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'')
const key=String(import.meta.env.VITE_SUPABASE_ANON_KEY||'')
const SESSION_STORE='mi-mapa.admin.session.v1'
export const supabaseConfigured=Boolean(url&&key)

export type AdminSession={access_token:string;refresh_token:string;expires_at?:number;user?:{email?:string}}
const headers=(token?:string)=>({apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json'})
async function request(path:string,init:RequestInit={}){const response=await fetch(`${url}${path}`,{...init,headers:{...headers(),...(init.headers||{})}});if(!response.ok)throw new Error((await response.text())||`Error ${response.status}`);if(response.status===204)return null;const text=await response.text();return text?JSON.parse(text):null}
const fromConsultant=(row:any):Consultant=>({id:row.id,name:row.name,photo:row.photo||'',description:row.description||'',training:row.training||[],specialties:row.specialties||[],modalities:row.modalities||[],city:row.city||'',languages:row.languages||[],durationMinutes:row.duration_minutes||60,priceLabel:row.price_label||'',contactUrl:row.contact_url||'',active:row.active!==false,featured:row.featured===true})
const toConsultant=(item:Consultant)=>({id:item.id||undefined,name:item.name,photo:item.photo,description:item.description,training:item.training,specialties:item.specialties,modalities:item.modalities,city:item.city||'',languages:item.languages,duration_minutes:item.durationMinutes,price_label:item.priceLabel,contact_url:item.contactUrl,active:item.active,featured:item.featured,updated_at:new Date().toISOString()})
const fromReferral=(row:any):Referral=>({id:row.id,consultantId:row.consultant_id||'',clientName:row.client_name,contact:row.contact,requestedAt:row.requested_at,sessionAt:row.session_at?String(row.session_at).slice(0,16):'',status:row.status,price:Number(row.price),commissionPaid:row.commission_paid===true,notes:row.notes||''})
const toReferral=(item:Referral)=>({id:item.id||undefined,consultant_id:item.consultantId||null,client_name:item.clientName,contact:item.contact,requested_at:item.requestedAt,session_at:item.sessionAt?new Date(item.sessionAt).toISOString():null,status:item.status,price:item.price,commission_paid:item.commissionPaid,notes:item.notes,updated_at:new Date().toISOString()})

export function loadAdminSession():AdminSession|null{try{return JSON.parse(localStorage.getItem(SESSION_STORE)||'null')}catch{return null}}
export async function signInAdmin(email:string,password:string){const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})});if(!response.ok)throw new Error('Revisa el correo y la contraseña.');const session=await response.json() as AdminSession;localStorage.setItem(SESSION_STORE,JSON.stringify(session));return session}
export function signOutAdmin(){localStorage.removeItem(SESSION_STORE)}

export async function fetchPublicDirectory():Promise<DirectoryData>{
  const [settings,consultants]=await Promise.all([request('/rest/v1/app_settings?id=eq.directory&select=directory_enabled'),request('/rest/v1/consultants?active=eq.true&select=*&order=featured.desc,sort_order.asc,name.asc')])
  return{enabled:settings?.[0]?.directory_enabled===true,consultants:(consultants||[]).map(fromConsultant),referrals:[]}
}
export async function fetchAdminDirectory(token:string):Promise<DirectoryData>{
  const adminHeaders=headers(token)
  const [settings,consultants,referrals]=await Promise.all([
    request('/rest/v1/app_settings?id=eq.directory&select=directory_enabled',{headers:adminHeaders}),
    request('/rest/v1/consultants?select=*&order=featured.desc,sort_order.asc,name.asc',{headers:adminHeaders}),
    request('/rest/v1/referrals?select=*&order=requested_at.desc',{headers:adminHeaders}),
  ])
  return{enabled:settings?.[0]?.directory_enabled===true,consultants:(consultants||[]).map(fromConsultant),referrals:(referrals||[]).map(fromReferral)}
}
export async function saveRemoteDirectory(data:DirectoryData,previous:DirectoryData,token:string){
  const adminHeaders={...headers(token),Prefer:'return=representation'}
  await request('/rest/v1/app_settings?id=eq.directory',{method:'PATCH',headers:adminHeaders,body:JSON.stringify({directory_enabled:data.enabled,updated_at:new Date().toISOString()})})
  for(const item of data.consultants){const existing=previous.consultants.some(value=>value.id===item.id);await request(existing?`/rest/v1/consultants?id=eq.${item.id}`:'/rest/v1/consultants',{method:existing?'PATCH':'POST',headers:adminHeaders,body:JSON.stringify(toConsultant(item))})}
  for(const item of previous.consultants.filter(value=>!data.consultants.some(next=>next.id===value.id)))await request(`/rest/v1/consultants?id=eq.${item.id}`,{method:'DELETE',headers:adminHeaders})
  for(const item of data.referrals){const existing=previous.referrals.some(value=>value.id===item.id);await request(existing?`/rest/v1/referrals?id=eq.${item.id}`:'/rest/v1/referrals',{method:existing?'PATCH':'POST',headers:adminHeaders,body:JSON.stringify(toReferral(item))})}
}

export async function uploadConsultantPhoto(file:File,token:string){const safe=`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const response=await fetch(`${url}/storage/v1/object/consultant-photos/${safe}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'true'},body:file});if(!response.ok)throw new Error('La fotografía requiere otro intento.');return`${url}/storage/v1/object/public/consultant-photos/${safe}`}
