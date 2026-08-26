import {describe,expect,it} from 'vitest'
import {pathForRoute,routeFromLocation,sanitizeLegacyUrl} from './routes'

describe('rutas públicas',()=>{
  it('abre cada herramienta mediante un path corto',()=>{
    expect(routeFromLocation('/hoy')).toEqual({view:'today'})
    expect(routeFromLocation('/calendario/')).toEqual({view:'calendar'})
    expect(routeFromLocation('/carta')).toEqual({view:'reading',section:'carta-completa'})
    expect(pathForRoute({view:'reading',section:'perfiles'})).toBe('/perfiles')
  })

  it('retira la carta codificada de los enlaces anteriores',()=>{
    const result=sanitizeLegacyUrl('https://mi-mapa.github.io/?c=datos-personales&vista=hoy&fecha=2026-08-26')
    expect(result.url.pathname).toBe('/hoy')
    expect(result.url.searchParams.get('fecha')).toBe('2026-08-26')
    expect(result.url.searchParams.has('c')).toBe(false)
    expect(result.url.searchParams.has('vista')).toBe(false)
    expect(result.discardedPrivateData).toBe(true)
  })

  it('convierte anclas anteriores en rutas limpias',()=>{
    const result=sanitizeLegacyUrl('https://mi-mapa.github.io/?vista=carta#carta-completa')
    expect(result.url.pathname).toBe('/carta')
    expect(result.url.hash).toBe('')
  })
})
