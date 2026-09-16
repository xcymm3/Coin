import { EXTRA_PLANTS } from './plantArt'
export function ExtraPlant({ id, className = '' }: { id: number; className?: string }) {
  const art = EXTRA_PLANTS[id - 10]
  return <span className={`sprite extra-plant ${className}`} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/garden-atlas.png)`, backgroundPosition: '66.6667% 66.6667%' }} aria-hidden="true"><svg viewBox="0 0 40 44" shapeRendering="crispEdges">
    <path d="M17 29V16h4v13Z" fill="#54a946" stroke="#243b2b" strokeWidth="2"/>
    <path d="M17 27h-7v-4H6v-4h8v4h4Zm4-2h5v-6h8v4h-4v5h-9Z" fill="#54b658" stroke="#243b2b" strokeWidth="2"/>
    <path d="M9 21h5v2H9Zm15 1h6v2h-6ZM18 23h2v7h-2Z" fill="#a4e66b"/>
    <g transform="translate(4 0) scale(1 .95)">
      <path d={art.shape} fill="#423041" stroke="#211d26" strokeWidth="4"/>
      <path d={art.shape} fill={art.color} stroke="#785d6955" strokeWidth="2"/>
      <path d="M14 9h3v3h-3Zm6 7h3v3h-3Z" fill={art.light}/>
      <path d="M16 12h2v2h-2Zm-4 6h3v2h-3Zm9-12h2v2h-2Z" fill="#fff8d8" opacity=".7"/>
    </g>
  </svg></span>
}
