const PALETTES = [
 ['#8a8d6b','#999c77','#c0b58a','#afb08a'],
 ['#405f48','#69855c','#a49d70','#819866'],
 ['#a18a5f','#b69e70','#d4bf91','#c9b482'],
 ['#7393a0','#a7bdc2','#d3dcca','#c3d3d0'],
 ['#55536b','#757083','#a89b8c','#9690a0'],
]
export function GardenHabitat({page}:{page:number}) {
 const colors=PALETTES[page]
 return <svg className="garden-habitat" viewBox="0 0 200 120" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
  <rect width="200" height="120" fill={colors[0]}/>
  {page===0&&<g fill="#707955">{[0,35,70,105].map(y=><path key={y} d={`M0 ${y}h200v1H0Z`}/>)}{[0,40,80,120,160,199].map(x=><path key={x} d={`M${x} 0h1v120h-1Z`}/>)}</g>}
  <path d="M0 0h200v2H0Z" fill={['#5e6649','#293f34','#7c6544','#526f7c','#ae9c78'][page]}/>
  <path d="M0 2h200v1H0Z" fill={['#b8b18a','#75885c','#dbc291','#c9d9d6','#4b435b'][page]}/>
  {[14,49,84].map(y=><g key={y}><path d={`M6 ${y}h22v-2h30v1h50v-2h42v2h43v16h-30v2h-44v-1H60v1H23v-2H6Z`} fill={colors[1]}/><path d={`M0 ${y+23}h28v-1h40v1h60v1h42v-1h30v4h-35v1h-40v-1H68v-1H27v1H0Z`} fill={colors[2]}/>{Array.from({length:24},(_,i)=><path key={i} d={`M${8+i*8} ${y+7+(i*7)%9}h2v1h-2Zm0 3h1v1h-1Z`} fill={i%3===0?colors[0]:colors[3]}/>)}{Array.from({length:10},(_,i)=><path key={i} d={`M${12+i*19} ${y+24}h4v1h-4Z`} fill={colors[3]}/>)}</g>)}
  {page===0&&<g fill="#354f3e" opacity=".12">{[15,62,109,156].map(x=><path key={x} d={`M${x} 3h2v15h2v20h2v20h2v20h2v20h2v20h-2V99h-2V79h-2V59h-2V39h-2V19h-2Z`}/>)}</g>}
  {page===0&&<g>{[37,72,107].map(y=><g key={y}><path d={`M13 ${y}h174v2H13Z`} fill="#6c6245"/><path d={`M14 ${y-1}h172v1H14Z`} fill="#d0bc83"/>{Array.from({length:14},(_,i)=><path key={i} d={`M${18+i*12} ${y-1}h1v3h-1Z`} fill="#87764f"/>)}</g>)}</g>}
  {page===1&&<><path d="M0 0h8v25h-2v32h3v25H6v38H0Zm193 0h7v120h-6V88h-2V54h3V25h-2Z" fill="#366c74"/><path d="M2 4h3v12H2Zm1 24h2v18H3Zm0 40h3v15H3Zm193-52h3v18h-3Zm2 41h2v17h-2Zm-2 40h3v20h-3Z" fill="#79b1a4"/></>}
  {page===2&&<g fill="#8a704b">{Array.from({length:15},(_,i)=><path key={i} d={`M${3+i*13} ${4+i*19%113}h4v1h-4Zm2 2h3v1h-3Z`}/>)}</g>}
  {page===3&&<g fill="#d5e1dc">{[0,35,70,105].map(y=><path key={y} d={`M0 ${y}h8v3h-2v4H0Zm192 0h8v7h-5v-3h-3Z`}/>)}</g>}
  {page===4&&<g fill="none" stroke="#a1937d" strokeWidth="1"><path d="M15 5h170v110H15Z"/><path d="M82 54h36v14H82Zm7-6h22v26H89Z"/></g>}
  <path d="M4 0h4v30H6v35h2v25H7v30H3V88h1V64H2V30h2ZM193 0h4v32h1v30h-2v29h1v29h-4V90h-1V60h2V32h-1Z" fill={colors[2]}/>
  {Array.from({length:28},(_,i)=>{const x=i%2?190:9,y=4+Math.floor(i/2)*8;return <g key={i}><path d={`M${x} ${y}h1v2h1v-3h1v4h-4v-3h1Z`} fill={colors[3]}/>{i%4===0&&<><path d={`M${x} ${y-1}h1v-1h1v1h1v1h-1v1h-1v-1h-1Z`} fill="#e4c49a"/><rect x={x+1} y={y-1} width="1" height="1" fill="#bd883e"/></>}</g>})}
 </svg>
}
