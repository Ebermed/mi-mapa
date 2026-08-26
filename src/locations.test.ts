import { describe, expect, it } from 'vitest'
import { locations, searchLocations } from './locations'

describe('catálogo mundial de ciudades',()=>{
  it('cubre más de 1,900 ciudades y 240 países o territorios',()=>{
    expect(locations.length).toBeGreaterThan(1900)
    expect(new Set(locations.map(location=>location.countryCode).filter(Boolean)).size).toBeGreaterThanOrEqual(240)
  })

  it('usa longitudes válidas y zonas horarias reconocidas',()=>{
    for(const location of locations){
      expect(location.longitude).toBeGreaterThanOrEqual(-180)
      expect(location.longitude).toBeLessThanOrEqual(180)
      expect(()=>new Intl.DateTimeFormat('es',{timeZone:location.timezone}).format(new Date())).not.toThrow()
    }
  })

  it('encuentra nombres en español, nombres internacionales y países',()=>{
    expect(searchLocations('CDMX')[0]?.city).toBe('Ciudad de México')
    expect(searchLocations('Tokyo')[0]?.city).toBe('Tokio')
    expect(searchLocations('Kinshasa')[0]?.timezone).toBe('Africa/Kinshasa')
    expect(searchLocations('Nigeria').some(location=>location.countryCode==='NG')).toBe(true)
  })
})
