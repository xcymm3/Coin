import {useEffect,useId,useRef,useState,type ReactNode} from 'react'

/** A visible pixel scrollbar also works in Android WebViews with overlay scrollbars. */
export function ModalScroll({children}:{children:ReactNode}){
 const id=useId(),body=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null)
 const drag=useRef<{offset:number}|null>(null)
 const [scroll,setScroll]=useState({top:0,height:0,total:0})
 const measure=()=>{const e=body.current;if(e)setScroll({top:e.scrollTop,height:e.clientHeight,total:e.scrollHeight})}
 useEffect(()=>{
  const observer=new ResizeObserver(measure)
  if(body.current)observer.observe(body.current)
  if(content.current)observer.observe(content.current)
  return()=>observer.disconnect()
 },[])
 const max=Math.max(0,scroll.total-scroll.height)
 const thumb=Math.min(scroll.height,Math.max(44,scroll.height*scroll.height/(scroll.total||1)))
 const travel=scroll.height-thumb,top=max?scroll.top/max*travel:0
 function seek(clientY:number,track:HTMLDivElement,offset:number){
  if(body.current&&travel>0)body.current.scrollTop=Math.max(0,Math.min(travel,clientY-track.getBoundingClientRect().top-offset))/travel*max
 }
 return <div className="modal-scroll-frame">
  <div id={id} ref={body} className="modal-body" onScroll={measure}><div ref={content} className="modal-content">{children}</div></div>
  {max>0&&<div className="pixel-scrollbar" role="scrollbar" tabIndex={0} aria-label="弹窗内容滚动条" aria-controls={id} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(scroll.top)}
   onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();const offset=e.target===e.currentTarget?thumb/2:e.clientY-e.currentTarget.getBoundingClientRect().top-top;drag.current={offset};e.currentTarget.setPointerCapture(e.pointerId);seek(e.clientY,e.currentTarget,offset)}}
   onPointerMove={e=>{if(drag.current)seek(e.clientY,e.currentTarget,drag.current.offset)}}
   onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}
   onKeyDown={e=>{const target=body.current;if(!target)return;const delta=({ArrowDown:40,ArrowUp:-40,PageDown:scroll.height*.9,PageUp:-scroll.height*.9,Home:-max,End:max} as Record<string,number>)[e.key];if(delta!==undefined){e.preventDefault();target.scrollTop+=delta}}}>
    <span className="pixel-scrollbar-thumb" style={{height:thumb,transform:`translateY(${top}px)`}}/>
  </div>}
 </div>
}
