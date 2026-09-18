import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {newGame,SAVE_KEY,PLANTS,reducer} from '../src/game.ts'
const {chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch()
mkdirSync('.artifacts/modal-check',{recursive:true})
try{
 for(const [width,height] of [[1440,1000],[390,844],[320,640]]){
  const mobile=width<500
  const page=await browser.newPage({...mobile?devices['Pixel 7']:{},viewport:{width,height},deviceScaleFactor:1})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  let s=newGame();s.coins=1000;s=reducer(s,{type:'hire',id:'recruit-water-1'})
  s.harvestCounts=PLANTS.map(()=>1);s.harvests=PLANTS.length
  await page.addInitScript(({s,key})=>localStorage.setItem(key,JSON.stringify({...s,lastSaved:Date.now()})),{s,key:SAVE_KEY})
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/')
  await page.getByRole('button',{name:/开始种植|继续我的花园/}).click()
  await page.getByRole('button',{name:'植物图鉴',exact:true}).click()
  const dialog=page.getByRole('dialog',{name:'植物图鉴'}),body=dialog.locator('.modal-body'),close=dialog.getByRole('button',{name:'关闭菜单'})
  await dialog.evaluate(e=>e.getAnimations().forEach(a=>a.finish()))
  const before=await close.boundingBox()
  assert.ok(before.width>=44&&before.height>=44)
  await body.evaluate(e=>{e.scrollTop=e.scrollHeight})
  const metrics=await body.evaluate(e=>({scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}))
  assert.ok(metrics.scrollTop>500)
  assert.ok(metrics.scrollTop+metrics.clientHeight>=metrics.scrollHeight-2)
  const after=await close.boundingBox()
  assert.equal(after.y,before.y);assert.ok(after.y>=0&&after.y+after.height<height)
  const bar=dialog.getByRole('scrollbar'),thumb=bar.locator('.pixel-scrollbar-thumb')
  assert.equal(await bar.isVisible(),true)
  assert.equal(await thumb.evaluate(e=>getComputedStyle(e).borderRadius),'0px')
  const handle=await thumb.boundingBox()
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y-100,{steps:5});await page.mouse.up()
  assert.ok(await body.evaluate(e=>e.scrollTop)<metrics.scrollTop)
  await bar.focus();await page.keyboard.press('Home');assert.equal(await body.evaluate(e=>e.scrollTop),0)
  await page.keyboard.press('End')
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.screenshot({path:`.artifacts/modal-check/book-bottom-${width}.png`})
  await close.click();assert.equal(await dialog.count(),0)
  await page.getByRole('button',{name:'玩法指南',exact:true}).click()
  const help=page.getByRole('dialog',{name:'玩法指南'})
  await help.locator('.modal-body').evaluate(e=>{e.scrollTop=e.scrollHeight})
  await page.keyboard.press('Escape');assert.equal(await help.count(),0)
  const snail=page.locator('.living-animal .creature-water').first()
  assert.equal(await snail.getAttribute('shape-rendering'),'crispEdges')
  assert.equal(await snail.locator('ellipse,circle,[shape-rendering="geometricPrecision"]').count(),0)
  const paths=await snail.locator('path').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('d')))
  assert.ok(paths.every(d=>!/[cqsat]/i.test(d)))
  if(width===1440){
   const svg=await snail.evaluate(e=>e.outerHTML)
   const sample=await browser.newPage({viewport:{width:400,height:320},deviceScaleFactor:1})
   await sample.setContent(`<style>body{margin:0;background:#12363b}svg{width:400px;height:320px;image-rendering:pixelated}</style>${svg}`)
   await sample.screenshot({path:'.artifacts/modal-check/pixel-snail.png'});await sample.close()
  }
  assert.deepEqual(errors,[])
  console.log(`PASS ${width}×${height}: header fixed at end of book, 44px close, themed scrollbar, Escape and pixel snail`)
  await page.close()
 }
}finally{await browser.close()}
