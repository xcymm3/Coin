export function DecorationArt({id}:{id:string}){
 if(id==='mushrooms')return <svg viewBox="0 0 24 100" shapeRendering="crispEdges">{[0,34,68].map(y=><g key={y} transform={`translate(0 ${y})`}><path fill="#e3ce9c" d="M10 16h5v12h-5z"/><path fill="#bd657c" d="M6 6h13v4h4v9H2v-9h4z"/><path fill="#fff0bd" d="M6 9h4v4H6zm10 3h4v4h-4z"/></g>)}</svg>
 if(id==='fountain')return <svg viewBox="0 0 40 48" shapeRendering="crispEdges"><path fill="#467986" d="M2 35h36v9H2zM8 28h24v7H8zM17 19h7v12h-7z"/><path fill="#b0e8e1" d="M6 35h28v4H6zM18 2h4v17h-4zM10 7h6v4h-6zM24 7h6v4h-6zM6 11h4v13H6zM30 11h4v13h-4z"/></svg>
 const text:Record<string,string>={bunting:'▼ ▾ ▼ ▾ ▼ ▾ ▼',fence:'╫ ╫ ╫',lights:'✦ · ✦ · ✦ · ✦',moon:'☾ ✧'}
 return <span>{text[id]}</span>
}
