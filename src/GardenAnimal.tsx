import type { CrewKind } from './upgrades'
/** Integer-grid silhouettes and separate parts keep animation in the sprite style. */
export function GardenAnimal({kind}:{kind:CrewKind}) {
 return <svg className={`creature-art creature-${kind}`} viewBox="0 0 40 32" shapeRendering="crispEdges" aria-hidden="true">
 {kind==='water'?<>
  <g className="snail-foot">
   <path d="M6 23h8v-2h14v-3h6v5h2v2h2v3h-3v1H8v-1H3v-3h3Z" fill="#55442f"/>
   <path d="M7 24h8v-2h14v-2h4v4h2v2h1v1H8v-1H5v-1h2Z" fill="#d2b67f"/>
   <path d="M8 25h24v1h3v1H8ZM10 27h3v1h-3Zm7 0h3v1h-3Zm7 0h3v1h-3Z" fill="#f7dfa3"/>
  </g>
  <g className="snail-shell">
   <path d="M11 5h9v1h4v2h2v3h2v10h-2v3h-4v1H11v-1H7v-3H5V11h2V8h2V6h2Z" fill="#543d2b"/>
   <path d="M11 7h9v1h3v2h2v3h1v7h-2v3H11v-1H8v-3H7v-7h2V9h2Z" fill="#b77947"/>
   <path d="M11 8h8v1h-7v2H9v3H8v-3h2V9h1Z" fill="#f0c486"/>
   <path d="M14 10h7v2h2v7h-2v2h-9v-2h-2v-5h2v-2h6v2h2v4h-5v-2h3v-2h-5v1h-1v3h2v1h6v-1h1v-5h-1v-1h-6Z" fill="#6f452c"/>
   <path d="M11 22h11v1H11ZM8 19h2v3H8Z" fill="#e4a664"/>
  </g>
  <g className="snail-head">
   <path d="M28 13h5v1h2v3h1v6h-2v2h-6v-2h-2v-6h1v-3h1Z" fill="#55442f"/>
   <path d="M29 14h3v1h2v3h1v4h-2v2h-4v-2h-2v-5h1v-2h1Z" fill="#d2b67f"/>
   <g className="snail-feelers">
    <path d="M26 9h2v5h1v2h-2v-3h-1Zm7-3h2v9h-2Z" fill="#b79b65"/>
    <path d="M24 5h5v1h1v5h-1v1h-5v-1h-1V6h1Zm8-3h5v1h1v5h-1v1h-5V8h-1V3h1Z" fill="#55442f"/>
    <path d="M24 6h5v5h-5Zm8-3h5v5h-5Z" fill="#fff6d7"/>
    <path d="M27 7h2v3h-2Zm8-3h2v3h-2Z" fill="#292d28"/>
    <path d="M27 7h1v1h-1Zm8-3h1v1h-1Z" fill="#ffffff"/>
   </g>
   <path d="M30 19h1v1h2v-1h1v2h-4Z" fill="#6d4936"/>
   <path d="M27 18h2v2h-2Z" fill="#d99379"/>
  </g>
 </>:kind==='harvest'?<>
  <g className="beetle-legs leg-a" fill="#343c26"><path d="M10 19H5v-3H3v5h7Zm8 4h-2v5h-5v2h7Zm8-5h5v-4h2v6h-7Z"/></g><g className="beetle-legs leg-b" fill="#343c26"><path d="M10 23H6v3H2v2h6v-3h2Zm8-12h-2V7h-5V5h7Zm8 12h5v3h5v2h-7v-3h-3Z"/></g>
  <g className="beetle-body"><path d="M10 8h11v2h4v3h2v10h-3v3H11v-2H7v-3H5v-8h2v-3h3Z" fill="#2d402b"/><path d="M11 10h10v2h3v10h-2v2H11v-2H8v-9h3Z" fill="#61823d"/><path d="M11 11h5v3h-4v3H9v-4h2Z" fill="#a3c66b"/><path d="M17 10h2v14h-2ZM11 20h3v2h-3Zm10-5h2v3h-2Z" fill="#3e592d"/><path d="M20 11h2v3h-2Z" fill="#88a34c"/><g className="creature-head"><path d="M27 12V7h2v5h3V9h4v2h-2v3h2v3h2v6h-3v2h-7v-2h-3v-8h2Z" fill="#33432b"/><path d="M28 14h6v3h2v5h-3v1h-5v-2h-2v-5h2Z" fill="#a3b96b"/><path d="M32 15h4v5h-4Z" fill="#f8edc0"/><path d="M34 16h2v3h-2Z" fill="#263229"/><path d="M29 21h3v1h-3Z" fill="#d2a76e"/></g></g>
 </>:<>
  <g className="squirrel-tail"><path d="M6 3h7v2h3v7h-3v3h-3v3h7v8H8v-2H5v-3H3v-5H1V9h2V5h3Z" fill="#553525"/><path d="M6 5h6v2h2v4h-3v2H8v6h5v5H8v-3H5v-5H3v-6h2V7h1Z" fill="#bb7038"/><path d="M6 7h4v2H7v7H5v-6h1Zm1 11h2v3h3v2H9v-2H7Z" fill="#edb66c"/></g>
  <path className="squirrel-leg leg-a" d="M15 24h5v5h3v2H13v-3h2Z" fill="#744629"/><path className="squirrel-leg leg-b" d="M27 24h4v4h4v3h-8Z" fill="#744629"/>
  <g className="squirrel-body"><path d="M17 13h10v3h4v11h-3v2H16v-2h-3v-9h2v-3h2Z" fill="#573927"/><path d="M18 15h8v3h3v8h-3v1h-9v-2h-2v-7h3Z" fill="#c78647"/><path d="M24 17h3v3h2v5h-3v2h-5v-3h-1v-4h2v-3Z" fill="#efc78a"/><g className="creature-head"><path d="M21 4h4v4h3V3h4v6h2v3h2v3h3v5h-4v3H24v-2h-4V10h1Z" fill="#573927"/><path d="M22 6h2v5h5V5h2v6h2v3h2v3h2v2h-3v2h-9v-2h-3Z" fill="#c78647"/><path d="M23 7h1v4h-1Zm7-1h1v5h-1Z" fill="#edb087"/><path d="M29 17h7v3h-9v-2h2Z" fill="#f2d39e"/><path d="M29 12h3v5h-3Z" fill="#292921"/><path d="M29 12h1v2h-1Z" fill="#fff3cd"/><path d="M36 16h3v2h-3Z" fill="#402b22"/><path d="M25 17h2v2h-2Z" fill="#dc9867"/></g><path className="squirrel-paw" d="M24 23h6v3h-4v-1h-2Z" fill="#99592f"/></g>
 </>}
 </svg>
}
