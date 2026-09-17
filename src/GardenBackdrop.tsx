/** Pixel scenery: distant landscape, architecture, then foreground posts. */
export function GardenBackdrop({page}:{page:number}) {
 return <svg className={`garden-backdrop backdrop-${page}`} viewBox="0 0 240 180" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
 {page===0?<>
  <path d="M0 0h240v180H0Z" fill="#5f7451"/>
  <path d="M4 2h232v46H4Z" fill="#284c4b"/>
  <path d="M6 4h228v11H6Z" fill="#467475"/>
  <path d="M6 18h228v25H6Z" fill="#537c69"/>
  <path d="M6 34h8v-7h8v-5h12v9h9v-4h13v9h9v-12h11v-5h14v10h12v7h10v-10h15v-7h9v11h16v-6h10v-6h13v13h13v-8h10v-5h14v13h14v-5h14v17H6Z" fill="#315b46"/>
  <path d="M7 7h32v2H7Zm49 0h30v2H56Zm47 0h31v2h-31Zm48 0h31v2h-31Zm48 0h29v2h-29Z" fill="#729992"/>
  {[5,52,99,146,193,234].map(x=><g key={x}><path d={`M${x} 2h3v45h-3Z`} fill="#253d37"/><path d={`M${x+1} 3h1v41h-1Z`} fill="#a0ae81"/><path d={`M${x+5} 18h2v4h-2v4h-2v4h-2v-5h2v-4h2Z`} fill="#8eafa0"/></g>)}
  <path d="M3 14h234v3H3Zm0 29h234v4H3Z" fill="#283d32"/><path d="M4 44h232v1H4Z" fill="#b0b186"/>
  <path d="M4 47h232v10H4Z" fill="#867956"/>
  {[0,1].map(row=>Array.from({length:15},(_,i)=><path key={`${row}-${i}`} d={`M${5+i*16+(row%2)*7} ${48+row*4}h13v3H${5+i*16+(row%2)*7}Z`} fill={i%3?'#a29168':'#756b4c'}/>))}
  <path d="M203 13h1v13h-1Zm-4 13h9v2h-9Z" fill="#b9a777"/><path d="M200 28h7v8h-7Z" fill="#d4b75f"/><path d="M202 29h3v5h-3Z" fill="#ffdc88"/>
  <path d="M181 40h46v2h-46v3h-2v-5Z" fill="#a58c58"/>
  {[185,196,217].map((x,i)=><g key={x}><path d={`M${x} 35h6v5h-6Z`} fill="#995b36"/><path d={`M${x+2} 35v-6h2v6m-2-3h-3v-3h3m2 2h3v-4h-3Z`} fill={i%2?'#9bac5d':'#739c55'}/></g>)}
  {[3,234].map(x=><g key={x}><path d={`M${x} 0h3v175h-3Z`} fill="#263c31"/><path d={`M${x+1} 0h1v174h-1Z`} fill="#b3b68d"/><path d={`M${x-1} 57h5v3h-5Zm0 52h5v3h-5Zm0 53h5v3h-5Z`} fill="#8d9c72"/></g>)}
 </>:page===1?<>
  <path d="M0 0h240v180H0Z" fill="#355b4b"/><path d="M4 3h232v45H4Z" fill="#233e47"/>
  <path d="M0 30h16v-9h14v-8h18v12h17v-7h20v-8h22v15h17v-9h25v10h19V12h24v9h18v-8h19v12h11v31H0Z" fill="#365e58"/>
  {[0,32,75,133,188,222].map((x,i)=><g key={x}><path d={`M${x} 0h${i%2?12:8}v54h-3V16h-2v38h-3Z`} fill="#243e35"/><path d={`M${x+2} 0h2v27h-2Z`} fill="#567254"/><path d={`M${x-10} 0h29v7h-5v6h-20V8h-4Z`} fill="#3d6445"/></g>)}
  <path d="M173 28h21v9h-7v7h-8v6h-9v8h-12v-9h10v-9h5Z" fill="#488c8e"/><path d="M175 30h13v2h-13Zm-4 13h9v2h-9Zm-10 8h9v2h-9Z" fill="#8bc6b4"/>
  {Array.from({length:18},(_,i)=><rect key={i} x={8+i*13} y={12+i*11%32} width="1" height="1" fill={i%2?'#bccb7d':'#82bdb0'}/>)}
  <path d="M0 48h17v-4h23v7h32v-3h40v6h38v-4h21v7h38v-9h31v132H0Z" fill="#3b6049"/>
  <path d="M2 51h6v121H2Zm230 0h7v121h-7Z" fill="#263d32"/>
  {Array.from({length:14},(_,i)=><path key={i} d={`M${i%2?229:7} ${48+i*9}h3v3h-5v4h-3v-3h2v-3h3Z`} fill="#71884f"/>)}
 </>:page===2?<>
  <path d="M0 0h240v180H0Z" fill="#8b764e"/><path d="M4 3h232v48H4Z" fill="#ceac75"/>
  <path d="M3 30h18v-6h14v-8h20v7h13v9h18v-4h20v-9h18v7h21v9h16v-8h14v-7h22v8h15v5h24v18H3Z" fill="#b58c59"/>
  <path d="M4 40h26v-7h22v6h31v-4h27v7h25v-6h30v5h27v-6h23v4h22v15H4Z" fill="#9f7549"/>
  {[4,72,158,226].map(x=><g key={x}><path d={`M${x} 8h10v43h-10Z`} fill="#735739"/><path d={`M${x+2} 10h5v38h-5Z`} fill="#d0b17a"/><path d={`M${x-2} 5h14v5h-14Zm0 39h14v5h-14Z`} fill="#b49461"/></g>)}
  <path d="M2 47h236v10H2Z" fill="#6e553a"/><path d="M3 47h234v3H3Z" fill="#d3b980"/>
  <path d="M188 39h3V23h3v9h4v-5h3v10h-7v7h-6Zm-3-7h-5v-9h3v6h2Z" fill="#70814b"/>
  <path d="M203 39h16v3h-2v8h-12v-8h-2Z" fill="#ae603c"/><path d="M205 42h3v6h-3Z" fill="#da945b"/>
  {[3,232].map(x=><g key={x}><path d={`M${x} 55h5v117h-5Z`} fill="#68553b"/>{Array.from({length:10},(_,i)=><path key={i} d={`M${x} ${57+i*11}h4v8h-4Z`} fill={i%2?'#b29965':'#9a8054'}/>)}</g>)}
 </>:page===3?<>
  <path d="M0 0h240v180H0Z" fill="#718e98"/><path d="M4 2h232v49H4Z" fill="#293f61"/>
  <path d="M8 3h9v8h15v5h20v4h27v5h30v-3h27v-5h29v-5h31V7h34v4h-31v6h-30v5h-30v5h-29v3H77v-5H50v-4H30v-5H14v-5H8Z" fill="#578f8d"/><path d="M28 1h8v7h22v5h29v5h27v-2h33v-5h33V6h30V2h20v3h-17v5h-30v5h-33v5h-35v3H85v-5H56v-5H33V8h-5Z" fill="#797f9e"/>
  <path d="M3 43h14v-8h8v-7h8v7h10v8h19v-5h8v-9h11v-8h8v8h12v10h13v5h17v-9h11v-8h10v8h11v8h24v-9h8v-7h9v7h12v9h20v11H3Z" fill="#a1b9c1"/>
  {[4,50,97,144,191,234].map(x=><g key={x}><path d={`M${x} 0h2v48h-2Z`} fill="#405e68"/><path d={`M${x+2} 0h1v48h-1Z`} fill="#c6dcd6"/><path d={`M${x+5} 15h5v1h-5Zm3-3h1v7h-1Z`} fill="#abcad0"/></g>)}
  <path d="M3 46h234v9H3Z" fill="#607a82"/><path d="M4 45h231v3H4Z" fill="#d5e1d6"/>
  <path d="M205 31h12v3h3v12h-18V34h3Z" fill="#3c4c51"/><path d="M206 35h10v8h-10Z" fill="#c08c56"/><path d="M209 36h4v5h-4Z" fill="#edc878"/>
  {[3,233].map(x=><g key={x}><path d={`M${x} 53h4v121h-4Z`} fill="#426571"/><path d={`M${x} 54h2v117h-2Z`} fill="#bacfc9"/></g>)}
 </>:<>
  <path d="M0 0h240v180H0Z" fill="#514e69"/><path d="M3 2h234v50H3Z" fill="#202b4b"/>
  <path d="M41 0h14v6h16v5h19v6h18v7h25v5h24v7h24v9h-19v-5h-23v-6h-24v-6H91v-7H73v-6H55v-6H41Z" fill="#3c3b61"/>
  {Array.from({length:45},(_,i)=><path key={i} d={`M${8+i*37%224} ${5+i*17%38}h${i%7===0?2:1}v1h-${i%7===0?2:1}Z`} fill={i%3?'#98abc4':'#e2ca91'}/>)}
  <path d="M204 9h10v2h3v10h-3v3h-10v-3h-3V12h3Z" fill="#d9cea5"/><path d="M210 9h4v3h3v9h-4v3h-5v-3h-3v-9h5Z" fill="#25304c"/>
  <path d="M4 38h8v-7h8v9h10v-6h12v5h14v-9h11v10h17v-7h10v7h18v-10h8v10h25v-5h12v5h15v-9h12v9h18v-5h12v6h23v13H4Z" fill="#323953"/>
  <path d="M3 43h234v3H3Zm0 8h234v5H3Z" fill="#ad9b76"/>
  {Array.from({length:15},(_,i)=><path key={i} d={`M${5+i*16} 45h2v8h-2Z`} fill="#68627a"/>)}
  {[3,233].map(x=><g key={x}><path d={`M${x} 54h4v120h-4Z`} fill="#34334d"/><path d={`M${x+1} 54h1v117h-1Z`} fill="#b8a47c"/></g>)}
 </>}
 <path d="M4 172h232v6H4Z" fill={['#4a5437','#293f34','#5f4c36','#425e6b','#36334b'][page]}/>
 <path d="M6 172h228v1H6Z" fill={['#9a9f6d','#6b8760','#bf9f6b','#a8c1c6','#a79981'][page]}/>
 </svg>
}
