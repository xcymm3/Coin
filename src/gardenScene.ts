/** Shared percentage coordinates keep plants, paths and depth aligned at every size. */
export function plantPosition(index: number) {
  const row = Math.floor(index / 5), col = index % 5
  return { x: 12 + col * 19 + (row === 1 ? -2 : 0), y: 24 + row * 29 + (col % 2 ? 2 : 0) }
}
type Stop = { x: number; y: number; pot?: number }
const route: Stop[] = []
for (let row = 0; row < 3; row++) {
  const columns = row === 1 ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]
  for (const col of columns) {
    const pot = row * 5 + col, pos = plantPosition(pot)
    route.push({ x: pos.x, y: 33 + row * 29, pot })
  }
  if (row < 2) {
    const side = row === 0 ? 94 : 6
    route.push({ x: side, y: 33 + row * 29 }, { x: side, y: 62 + row * 29 })
  }
}
route.push({ x: 94, y: 91 }, { x: 94, y: 7 }, { x: 6, y: 7 }, { x: 6, y: 33 })
const travel = route.map((stop, i) => {
  const next = route[(i + 1) % route.length]
  return Math.hypot(next.x - stop.x, next.y - stop.y) / 8
})
export const patrolDuration = travel.reduce((sum, t, i) => sum + t + (route[i].pot === undefined ? 0 : 1.4), 0)
/** Visual patrol only; growth and automatic watering remain owned by the game engine. */
export function residentPose(elapsed: number, resident: number) {
  let clock = ((elapsed + resident * 23) % patrolDuration + patrolDuration) % patrolDuration
  for (let i = 0; i < route.length; i++) {
    const start = route[i], end = route[(i + 1) % route.length]
    const dwell = start.pot === undefined ? 0 : 1.4
    const facing = end.x < start.x ? -1 : 1
    if (clock < dwell) return { ...start, facing, resting: true }
    clock -= dwell
    if (clock < travel[i]) {
      const t = clock / travel[i]
      return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t, facing, resting: false, pot: undefined }
    }
    clock -= travel[i]
  }
  return { ...route[0], facing: 1, resting: true }
}
