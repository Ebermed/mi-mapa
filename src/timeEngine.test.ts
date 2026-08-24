import { describe, expect, it } from 'vitest'
import { calculateChart, fixtures } from './engine'
import { classifyActivity, cycleReading, dayReading, monthReading, searchActivityYear } from './timeEngine'

describe('lecturas personales de tiempo', () => {
  const eber = calculateChart(fixtures.eber)
  const anju = calculateChart(fixtures.anju)

  it('cambia la lectura diaria al cambiar de fecha y la personaliza con la carta', () => {
    const first = dayReading(eber, '2026-08-23')
    const next = dayReading(eber, '2026-08-24')
    const otherChart = dayReading(anju, '2026-08-23')

    expect(first.pillar.branch).not.toBe(next.pillar.branch)
    expect(first.headline).toContain('23 de agosto')
    expect(first.opportunity).toHaveLength(3)
    expect(first.personal).not.toBe(otherChart.personal)
  })

  it('marca el día de choque personal contra el animal del año de nacimiento', () => {
    const horseDay = dayReading(eber, '2026-08-24')
    const nextDay = dayReading(eber, '2026-08-25')

    expect(eber.pillars.year.branch).toBe('rat')
    expect(horseDay.pillar.branch).toBe('horse')
    expect(horseDay.personalClash).toMatchObject({active:true,birthBranch:'rat',dayBranch:'horse'})
    expect(horseDay.personalClash.title).toBe('Caballo choca con Rata')
    expect(classifyActivity(eber, '2026-08-24', 'launch').state).toBe('move')
    expect(nextDay.personalClash.active).toBe(false)
  })

  it('entrega un enfoque mensual y fechas concretas para dos configuraciones', () => {
    const first = monthReading(eber, 2026, 8)
    const second = monthReading(anju, 2026, 8)

    expect(first.days).toHaveLength(31)
    expect(first.featured).toHaveLength(3)
    expect(first.area.actions).toHaveLength(3)
    expect(first.personal).not.toBe(second.personal)
  })

  it('calcula las etapas de diez años con el método tradicional', () => {
    const female = cycleReading(anju, 'female', new Date('2026-08-23T12:00:00Z'))
    const male = cycleReading(eber, 'male', new Date('2026-08-23T12:00:00Z'))

    expect(female.items.length).toBeGreaterThanOrEqual(8)
    expect(male.items.length).toBeGreaterThanOrEqual(8)
    expect(female.current.startYear).toBeLessThanOrEqual(2026)
    expect(female.current.endYear).toBeGreaterThanOrEqual(2026)
    expect(female.items[0].pillar).not.toEqual(male.items[0].pillar)
  })

  it('busca fechas para una actividad y conserva resultados personalizados', () => {
    const results = searchActivityYear(eber, 2026, 'launch')
    const sameDateEber = classifyActivity(eber, '2026-08-23', 'launch')
    const sameDateAnju = classifyActivity(anju, '2026-08-23', 'launch')

    expect(results).toHaveLength(365)
    expect(results.some(item => item.state === 'good')).toBe(true)
    expect(results.some(item => item.state === 'move')).toBe(true)
    expect(sameDateEber.reading.personal).not.toBe(sameDateAnju.reading.personal)
  })
})
