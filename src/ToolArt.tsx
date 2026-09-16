import type { CSSProperties } from 'react'
export type GardenTool = 'water' | 'fertilizer' | 'cart' | 'shovel'
export function ToolArt({kind}:{kind:GardenTool}) {
 return <svg className={`garden-tool-art art-${kind}`} viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true" style={{'--tool-shadow':'#352617'} as CSSProperties}>
  {kind==='water'&&<>
   <path fill="#392a18" d="M13 10h23v5h4v24h-4v4H12v-4H8V26L2 16v-6h7l7 10h3v-5h-6z"/>
   <path fill="#cba42d" d="M14 19h21v20H13V25H9L4 15v-3h3l8 11h4v-4z"/>
   <path fill="#ffe374" d="M15 21h5v17h-5zM3 11h6v4H3zM15 11h18v4H15z"/>
   <path fill="#e7ba38" d="M32 12h6v5h3v13h-5V18h-4z"/>
   <path fill="#705824" d="M20 18h12v4H20zM21 35h13v4H21z"/>
   <path fill="#8bd7dc" d="M22 18h9v2h-9z"/>
  </>}
  {kind==='fertilizer'&&<>
   <path fill="#362819" d="M12 5h24v8l5 8v20H7V21l5-8z"/>
   <path fill="#d6bd7d" d="M14 7h20v7l5 9v15H10V23l5-9z"/>
   <path fill="#f1dfad" d="M16 15h5v6h-6v14h-4V23zM14 7h20v3H14z"/>
   <path fill="#a2834a" d="M14 11h20v4H14zM33 22h5v16H13v-3h20z"/>
   <path fill="#2d6440" d="M16 23h16v10H16z"/>
   <path fill="#91c653" d="M19 22h4v4h2v-6h5v6h-4v5h-4v-5h-3z"/>
  </>}
  {kind==='cart'&&<>
   <path fill="#31271e" d="M3 15h5v6h32v-5h5v4h-3v14H25v5h-5v-5H9z"/>
   <path fill="#bc4c35" d="M9 19h31v10H14z"/>
   <path fill="#f18b55" d="M8 17h33v5H11z"/>
   <path fill="#6f372b" d="M14 27h25v4H17z"/>
   <path fill="#d0b378" d="M3 13h5v5H3zM38 30h3v9h-3zM20 30h4v9h-4z"/>
   <path fill="#252c2d" d="M11 32h10v11H11z"/><path fill="#88969b" d="M14 35h4v5h-4z"/>
  </>}
  {kind==='shovel'&&<>
   <path fill="#35291d" d="M27 2h15v13h-5L25 32h5v9l-11 5-9-8v-9h9l11-15h-3z"/>
   <path fill="#a86937" d="M30 5h9v7h-4L22 33l-4-3 15-19h-3z"/>
   <path fill="#edbb76" d="M30 5h9v3h-9zM31 15l3 2-12 16-3-2z"/>
   <path fill="#a5bfc4" d="M12 31h13v8l-6 4-7-6z"/>
   <path fill="#e1efdf" d="M12 31h5v8l-5-3z"/><path fill="#68868c" d="M22 32h4v7l-7 4v-4h3z"/>
  </>}
 </svg>
}
