export type GardenTool = 'water' | 'fertilizer' | 'cart' | 'shovel'
export function ToolArt({kind,waterLevel=3}:{kind:GardenTool;waterLevel?:number}) {
 return <svg className={`garden-tool-art art-${kind}`} viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true">
  {kind==='water'&&<g strokeLinejoin="round">
   <path d="M30 9C47 4 48 31 33 30" fill="none" stroke="#42351b" strokeWidth="7"/>
   <path d="M30 9C44 6 45 27 34 27" fill="none" stroke="#f5cc46" strokeWidth="4"/>
   <path d="M15 21 7 14 4 5 1 7l2 13 12 13" fill="#dfb32f" stroke="#49391d" strokeWidth="2"/>
   <path d="M14 16Q25 11 36 16l-1 24Q24 46 13 40Z" fill={waterLevel===0?'#94824d':'#e5bc32'} stroke="#49391d" strokeWidth="2"/>
   <path d="M17 19h15v19q-7 4-15 0z" fill="#615f46"/>
   {waterLevel>0&&<path d={waterLevel===3?'M17 21q7 3 15 0v17q-7 4-15 0Z':waterLevel===2?'M17 29q7 3 15 0v9q-7 4-15 0Z':'M17 35q7 2 15 0v3q-7 4-15 0Z'} fill={waterLevel===1?'#5a9a99':'#4fbac7'}/>}
   {waterLevel>0&&<path d={waterLevel===3?'M18 21q7 3 13 0':waterLevel===2?'M18 29q7 3 13 0':'M18 35q7 2 13 0'} fill="none" stroke="#c9f6df" strokeWidth="2"/>}
   <path d="M14 17q11-6 22 0-11 7-22 0Z" fill="#514b27" stroke="#ffe36a" strokeWidth="2"/>
   <path d="M14 21v16m1-14v12" stroke={waterLevel===0?'#c0af75':'#fff09b'} strokeWidth="3"/>
   <path d="M5 7 8 14l6 5" stroke="#fff0a0" strokeWidth="2" fill="none"/>
  </g>}
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
