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
  {kind==='shovel'&&<>
   <path fill="#35291d" d="M27 2h15v13h-5L25 32h5v9l-11 5-9-8v-9h9l11-15h-3z"/>
   <path fill="#a86937" d="M30 5h9v7h-4L22 33l-4-3 15-19h-3z"/>
   <path fill="#edbb76" d="M30 5h9v3h-9zM31 15l3 2-12 16-3-2z"/>
   <path fill="#a5bfc4" d="M12 31h13v8l-6 4-7-6z"/>
   <path fill="#e1efdf" d="M12 31h5v8l-5-3z"/><path fill="#68868c" d="M22 32h4v7l-7 4v-4h3z"/>
  </>}
 </svg>
}
