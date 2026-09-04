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

/** Fuente temporal hasta conectar el centro de control protegido. */
export const consultantDirectory = {
  enabled: false,
  consultants: [] as Consultant[],
}
