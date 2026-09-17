export function GardenHabitat({page}:{page:number}) {
 const colors=[['#728959','#91a46b','#c3bc91','#a6b78a'],['#628e73','#86b59a','#b6c5a2','#d0d5a5'],['#a18a55','#c1ac71','#d6c39c','#aeb775'],['#93acb3','#bdcfd0','#dce2d5','#c9dad7'],['#74768d','#9597a3','#c2bcc3','#c0c6cf']][page]
 return <svg className="garden-habitat" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
  <rect width="1000" height="600" fill={colors[0]}/>
  {[72,248,423].map((y,row)=><g key={y}><path d={`M32 ${y}Q150 ${y-28} 300 ${y-9}T620 ${y-12}T970 ${y}L970 ${y+78}Q780 ${y+94} 620 ${y+77}T310 ${y+89}T32 ${y+80}Z`} fill={colors[1]}/>{Array.from({length:17},(_,i)=><path key={i} d={`m${40+i*55} ${y+70+(i%3)*4} -3 -10 7 5 5 -12 1 16`} fill={colors[0]}/>) }<path d={`M0 ${y+112}Q260 ${y+92} 510 ${y+113}T1000 ${y+112}`} stroke={colors[2]} strokeWidth="28" fill="none" opacity=".8"/>{Array.from({length:12},(_,i)=><path key={i} d={`m${25+i*83} ${y+105+(i%3)*3} 31 -3 9 7 -32 4Z`} fill={colors[3]} opacity=".65"/>)}<g opacity=".5">{Array.from({length:14},(_,i)=><ellipse key={i} cx={50+i*68} cy={y+20+(i*17+row*11)%47} rx={3+i%3} ry="2" fill={colors[3]}/>)}</g></g>)}
  <path d="M22 0Q5 180 22 340T24 600M978 0q15 170 0 340t0 260" fill="none" stroke={colors[2]} strokeWidth="32"/>
  {Array.from({length:20},(_,i)=>{const x=i%2?964:36,y=22+Math.floor(i/2)*59;return <g key={i}><path d={`m${x} ${y} -9 -14 8 5 2-15 4 16 8-5-7 13Z`} fill={colors[1]}/>{i%3===0&&<><circle cx={x+4} cy={y-11} r="4" fill={page===3?'#e3eeef':'#eac5a1'}/><circle cx={x+4} cy={y-11} r="1.5" fill="#d6ab5f"/></>}</g>})}
 </svg>
}
