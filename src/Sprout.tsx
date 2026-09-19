import type { CSSProperties } from 'react'
import { EXTRA_PLANTS } from './plantArt'

// Hand-drawn pixel silhouettes: species stay recognisable before their adult sprite appears.
const buds = [
  { color: '#76da49', shape: 'M14 18H8v-3H5V9h6v3h5v5h2v-5h4V8h6v7h-3v3h-7v8h-4Z', light: 'M7 10h3v3H7Zm17-1h3v4h-3Z' },
  { color: '#ed665c', shape: 'M8 17v-5h3V8h10v3h4v6Zm6 0h5v9h-5Z', light: 'M12 10h3v3h-3Zm7 3h3v3h-3Z' },
  { color: '#f4a3be', shape: 'M11 7h3v3h4V6h3v12h-3v8h-4v-8h-3Z', light: 'M13 11h3v5h-3Z' },
  { color: '#5dc9f2', shape: 'M15 5h3v4h3v4h3v7h-6v6h-4v-6H9v-7h3V9h3Z', light: 'M13 12h3v6h-3Z' },
  { color: '#dcd1f5', shape: 'M14 15V6h4v9h7v4h-7v7h-4v-7H7v-4Zm-4-5h3v4h-3Zm9 0h3v4h-3Z', light: 'M15 8h2v6h-2Z' },
  { color: '#f8ca45', shape: 'M12 8h8v3h4v8h-6v7h-4v-7H8v-8h4Z', light: 'M12 11h8v5h-8Z' },
  { color: '#bc70dd', shape: 'M7 10h7v3h4v-3h7v8h-4v3h-3v5h-4v-5h-3v-3H7Z', light: 'M9 11h3v4H9Zm11 0h3v4h-3Z' },
  { color: '#7ddfee', shape: 'M6 13h4V8h4v10h2V4h4v5h3v10h-5v7h-4v-6H9v-3H6Z', light: 'M17 7h2v10h-2ZM10 11h2v5h-2Z' },
  { color: '#aa8bed', shape: 'M13 7h5v3h5v4h3v7h-8v-7h-2v12h-4V11H8V7Z', light: 'M20 15h3v4h-3Z' },
  { color: '#ffe197', shape: 'M14 4h4v6h7v4h-4v5h-3v7h-4v-7h-3v-5H7v-4h7Z', light: 'M14 10h4v7h-4Z' },
]
export function Sprout({ id, tiny, maturing = false }: { id: number; tiny: boolean; maturing?: boolean }) {
  const extra = EXTRA_PLANTS[id - 10]
  const bud = id < 10 ? buds[id] : { color: extra.color, shape: extra.bud, light: 'M14 12h3v3h-3Z' }
  return <svg data-testid={`sprout-${id}`} data-species={id} className={`species-sprout ${tiny ? 'tiny-sprout' : ''} ${maturing ? 'maturing-sprout' : ''}`} style={{ '--bud-color': bud.color } as CSSProperties} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M14 18h4v10h-4ZM8 20h6v4H8Zm10 2h7v3h-7Z" fill="#48863d" stroke="#233e2b" strokeWidth="2" />
    <path d={bud.shape} fill={bud.color} stroke="#293c30" strokeWidth="2" strokeLinejoin="miter" />
    <path d={bud.light} fill={id === 1 ? '#ffe5cd' : '#f4f3c6'} />
  </svg>
}
