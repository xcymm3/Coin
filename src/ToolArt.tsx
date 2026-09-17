export type GardenTool = 'water' | 'fertilizer' | 'cart' | 'shovel'
export function ToolArt({kind,waterLevel=3}:{kind:GardenTool;waterLevel?:number}) {
 return <svg className={`garden-tool-art art-${kind}`} viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true">
  {kind==='water'&&<>
   <path d="M30 8h11v3h4v17h-4v4h-7v-5h5v-3h2V14h-3v-2h-8Z" fill="#473621"/>
   <path d="M31 10h9v3h3v13h-3v4h-5v-3h4v-3h2V14h-3v-2h-7Z" fill="#e9bd42"/>
   <path d="M1 5h5v7h3v5h7v-2h20v3h2v22h-3v3H15v-3h-3V26H8v-5H5v-7H2Z" fill="#473621"/>
   <path d="M3 7h2v7h3v5h8v3h-3v-1H9v-3H6v-4H4Z" fill="#f6d66c"/>
   <path d="M15 18h20v21h-3v2H17v-2h-2Z" fill={waterLevel===0?'#9f8d55':'#dbb33c'}/>
   <path d="M19 21h13v16H19Z" fill="#646244"/>
   {waterLevel>0&&<path d={`M19 ${waterLevel===3?23:waterLevel===2?29:34}h13v${waterLevel===3?14:waterLevel===2?8:3}H19Z`} fill="#5ab7bb"/>}
   {waterLevel>0&&<path d={`M20 ${waterLevel===3?23:waterLevel===2?29:34}h10v2H20Z`} fill="#bfedcd"/>}
   <path d="M16 16h17v2h3v2H15v-2h1Z" fill="#f3d56b"/>
   <path d="M18 17h14v2H18Z" fill="#61522c"/><path d="M15 22h2v15h-2Zm3 17h13v2H18Z" fill="#efcf6d"/>
  </>}
  {kind==='fertilizer'&&<>
   <path fill="#362819" d="M12 5h24v8l5 8v20H7V21l5-8z"/>
   <path fill="#55b6b5" d="M14 7h20v7l5 9v15H10V23l5-9z"/>
   <path fill="#b6f0c3" d="M16 15h5v6h-6v14h-4V23zM14 7h20v3H14z"/>
   <path fill="#257476" d="M14 11h20v4H14zM33 22h5v16H13v-3h20z"/>
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
  {kind==='shovel'&&<g transform="rotate(45 24 24)">
   {/* Draw upright on one centerline, then rotate the whole shovel. */}
   <path fill="#35291d" fillRule="evenodd" d="M16 3h16v9l-5 5v13h-6V17l-5-5Zm4 4v4l4 4 4-4V7Z"/>
   <path fill="#a86937" d="M18 5h12v2H18Zm0 2h2v5l4 4 4-4V7h2v6l-5 5v12h-2V18l-5-5Z"/>
   <path fill="#edbb76" d="M18 5h12v2H18Zm5 13h1v12h-1Z"/>
   <path fill="#35291d" d="M14 28h20v9l-2 4-8 5-8-5-2-4Z"/>
   <path fill="#a5bfc4" d="M16 30h16v7l-2 3-6 4-6-4-2-3Z"/>
   <path fill="#e1efdf" d="M16 30h7v3h-5v4l2 3-2-1-2-3Z"/>
   <path fill="#68868c" d="M25 30h7v7l-2 3-6 4v-3l5-3 1-3v-3h-5Z"/>
   <path fill="#d2ded3" d="M23 28h2v12h-2Z"/>
  </g>}
 </svg>
}
