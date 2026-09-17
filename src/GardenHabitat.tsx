const PALETTES = [
 ['#6b8050','#84995c','#b8af80','#9bab70'],
 ['#50775c','#769773','#b1bd8b','#91b18a'],
 ['#8d7846','#aa945a','#cbb889','#b9a867'],
 ['#849da0','#b2c8c5','#d3dcca','#c4d6cd'],
 ['#595974','#77768a','#b0a3aa','#9898af'],
]
export function GardenHabitat({page}:{page:number}) {
 const colors=PALETTES[page]
 return <svg className="garden-habitat" viewBox="0 0 200 120" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
  <rect width="200" height="120" fill={colors[0]}/>
  {[14,49,84].map(y=><g key={y}><path d={`M6 ${y}h22v-2h30v1h50v-2h42v2h43v16h-30v2h-44v-1H60v1H23v-2H6Z`} fill={colors[1]}/><path d={`M0 ${y+23}h28v-1h40v1h60v1h42v-1h30v4h-35v1h-40v-1H68v-1H27v1H0Z`} fill={colors[2]}/>{Array.from({length:24},(_,i)=><path key={i} d={`M${8+i*8} ${y+7+(i*7)%9}h2v1h-2Zm0 3h1v1h-1Z`} fill={i%3===0?colors[0]:colors[3]}/>)}{Array.from({length:10},(_,i)=><path key={i} d={`M${12+i*19} ${y+24}h4v1h-4Z`} fill={colors[3]}/>)}</g>)}
  <path d="M4 0h4v30H6v35h2v25H7v30H3V88h1V64H2V30h2ZM193 0h4v32h1v30h-2v29h1v29h-4V90h-1V60h2V32h-1Z" fill={colors[2]}/>
  {Array.from({length:28},(_,i)=>{const x=i%2?190:9,y=4+Math.floor(i/2)*8;return <g key={i}><path d={`M${x} ${y}h1v2h1v-3h1v4h-4v-3h1Z`} fill={colors[3]}/>{i%4===0&&<><path d={`M${x} ${y-1}h1v-1h1v1h1v1h-1v1h-1v-1h-1Z`} fill="#e4c49a"/><rect x={x+1} y={y-1} width="1" height="1" fill="#bd883e"/></>}</g>})}
 </svg>
}
