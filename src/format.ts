const SHORT_SCALE = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
] as const

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const absolute = Math.abs(value)
  if (absolute < 1_000) return Math.floor(value).toLocaleString('en-US')

  const group = Math.floor(Math.log10(absolute) / 3)
  if (group >= SHORT_SCALE.length) return value.toExponential(2).replace('e+', 'e')

  const scaled = value / 1_000 ** group
  const decimals = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2
  return `${scaled.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9])0$/, '')}${SHORT_SCALE[group]}`
}
