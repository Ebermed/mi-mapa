import { describe, expect, it } from 'vitest'
import { calculateChart, fixtures } from './engine'

describe('cartas de referencia',()=>{
  it('conserva los cuatro pilares de Eber',()=>{
    const c=calculateChart(fixtures.eber)
    expect([c.pillars.year.stem,c.pillars.year.branch]).toEqual(['bing','rat'])
    expect([c.pillars.month.stem,c.pillars.month.branch]).toEqual(['yi','goat'])
    expect([c.pillars.day.stem,c.pillars.day.branch]).toEqual(['wu','horse'])
    expect([c.pillars.hour.stem,c.pillars.hour.branch]).toEqual(['ding','snake'])
  })
  it('conserva los cuatro pilares de Anju',()=>{
    const c=calculateChart(fixtures.anju)
    expect([c.pillars.year.stem,c.pillars.year.branch]).toEqual(['geng','dragon'])
    expect([c.pillars.month.stem,c.pillars.month.branch]).toEqual(['geng','dragon'])
    expect([c.pillars.day.stem,c.pillars.day.branch]).toEqual(['yi','rabbit'])
    expect([c.pillars.hour.stem,c.pillars.hour.branch]).toEqual(['ding','ox'])
  })
  it('calcula los vacíos desde el pilar del día',()=>{
    expect(calculateChart(fixtures.eber).voidBranches.length).toBe(2)
    expect(calculateChart(fixtures.anju).voidBranches.length).toBe(2)
  })
  it('ajusta automáticamente la hora civil con zona histórica y longitud',()=>{
    const eber=calculateChart(fixtures.eber)
    const anju=calculateChart(fixtures.anju)
    expect(eber.birth.calculationTime).not.toBe(fixtures.eber.time)
    expect(anju.birth.calculationTime).not.toBe(fixtures.anju.time)
    expect(Number.isFinite(eber.birth.solarCorrectionMinutes)).toBe(true)
    expect(eber.birth.zoneOffset).toBe(-5)
    expect(anju.birth.zoneOffset).toBe(-5)
  })
})

