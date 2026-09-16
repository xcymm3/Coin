/** Shared percentage coordinates keep plants, paths and depth aligned at every size. */
export function plantPosition(index: number) {
  const row = Math.floor(index / 5), col = index % 5
  return { x: 12 + col * 19 + (row === 1 ? -2 : 0), y: 24 + row * 29 + (col % 2 ? 2 : 0) }
}