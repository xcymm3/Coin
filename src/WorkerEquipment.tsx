import { MATERIALS, type CrewKind } from './upgrades'
export function WorkerEquipment({kind,level,loaded}:{kind:CrewKind;level:number;loaded:boolean}) {
 const m=MATERIALS[level]
 return <svg className={`worker-equipment gear-${kind} gear-tier-${level}`} viewBox="0 0 40 34" aria-hidden="true" shapeRendering="crispEdges">
  <path fill="#263236" d="M4 7h29v21H4z"/><path fill={m.color} d="M6 9h25v16H6z"/><path fill={m.light} d="M6 9h25v3H6zM7 14h3v9H7z"/>
  {level===0?<path stroke="#62452d" strokeWidth="2" d="M12 12v13m7-13v13m7-13v13M6 19h25"/>:<path fill={m.light} d="M6 14h3v3H6zm22 0h3v3h-3zM6 21h3v3H6zm22 0h3v3h-3z"/>}
  {kind==='water'?<><path fill="#84dce9" d="M12 15h13v7H12z"/><path fill="#d0faff" d="M13 15h11v2H13z"/><path fill={m.light} d="M30 11h8v4h-4v4h-4z"/></>:loaded?<path fill={kind==='harvest'?'#97c94a':'#e9ce80'} d="M10 3h6v6h-6zm10-2h6v7h-6zm5 5h5v5h-5z"/>:null}
  {kind==='harvest'&&level>=2&&<><path fill="#273137" d="M7 25h7v7H7zm16 0h7v7h-7z"/><path fill={m.light} d="M9 27h3v3H9zm16 0h3v3h-3z"/></>}
  {level>=3&&<path fill={level===4?'#e1ffff':'#fff2a3'} d="M17 12h5v3h3v5h-3v3h-5v-3h-3v-5h3z"/>}
  {level===4&&<g className="equipment-glint" fill="#fff"><path d="M32 0h2v3h3v2h-3v3h-2V5h-3V3h3zM1 22h2v3h3v2H3v3H1v-3h-3v-2h3z"/></g>}
 </svg>
}
