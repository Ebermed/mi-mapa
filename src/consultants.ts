export type Consultant = {
  id: string
  name: string
  photo: string
  description: string
  training: string[]
  specialties: string[]
  modalities: ('Videollamada'|'Presencial')[]
  city?: string
  languages: string[]
  durationMinutes: number
  priceLabel: string
  contactUrl: string
  active: boolean
  featured: boolean
}

export type ReferralStatus = 'Nueva'|'Contactada'|'Reservada'|'Realizada'|'Cancelada'
export type Referral = {
  id: string
  consultantId: string
  clientName: string
  contact: string
  requestedAt: string
  sessionAt: string
  status: ReferralStatus
  price: number
  commissionPaid: boolean
  notes: string
}

export type DirectoryData = {
  enabled: boolean
  consultants: Consultant[]
  referrals: Referral[]
}

export const EMPTY_DIRECTORY:DirectoryData = {
  enabled: false,
  consultants: [],
  referrals: [],
}

const DIRECTORY_STORE='mi-mapa.consultants.v1'

export function loadDirectory():DirectoryData{
  try{
    const parsed=JSON.parse(localStorage.getItem(DIRECTORY_STORE)||'null') as Partial<DirectoryData>|null
    if(!parsed||!Array.isArray(parsed.consultants)||!Array.isArray(parsed.referrals))return EMPTY_DIRECTORY
    return{enabled:parsed.enabled===true,consultants:parsed.consultants,referrals:parsed.referrals}
  }catch{return EMPTY_DIRECTORY}
}

export function saveDirectory(data:DirectoryData){
  localStorage.setItem(DIRECTORY_STORE,JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('mi-mapa-directory-change',{detail:data}))
}
