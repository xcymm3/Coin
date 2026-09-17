import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {newGame,PLANTS,SAVE_KEY} from '../src/game.ts'
import {expanded,employ} from '../tests/helpers.mjs'
const {chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({headless:true})
const output='.artifacts/landscape-layout';mkdirSync(output,{recursive:true})
try {
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600]]){
  const context=await browser.newContext({...devices['Pixel 7'],viewport:{width,height},deviceScaleFactor:1})
  const errors=[]
  async function open(s){
   const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message))
   await p.addInitScript(({s,key})=>localStorage.setItem(key,JSON.stringify({...s,lastSaved:Date.now()})),{s,key:SAVE_KEY})
   await p.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/')
   await p.getByRole('button',{name:/开始种植|继续我的花园/}).tap();return p
  }
  let s=employ(expanded(),'sow');s.elapsed=100;s.weather={kind:1,started:100,next:500}
  for(let i=60;i<75;i++)s.pots[i]={plant:10+i%3,growth:PLANTS[10+i%3].seconds,wateredAt:-10}
  let p=await open(s)
  assert.equal(await p.locator('.mobile-nav').isVisible(),false)
  assert.equal(await p.getByTestId('plant-inspector').isVisible(),false)
  const metrics=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,boxes:[...document.querySelectorAll('.pot,.pool-refill-button,.scene-arrow,[aria-label="玩法指南"]')].map(e=>e.getBoundingClientRect().toJSON())}))
  assert.equal(metrics.w,width);assert.equal(metrics.h,height)
  for(const r of metrics.boxes){assert.ok(r.width>=44&&r.height>=44,'touch target');assert.ok(r.x>=0&&r.y>=0&&r.right<=width&&r.bottom<=height,'fits viewport')}
  const picker=p.locator('.landscape-seed-picker select');await picker.selectOption('1');assert.equal(await picker.inputValue(),'1')
  await p.screenshot({path:`${output}/garden-${width}.png`})
  const oldWidth=(await p.locator('.garden-board').boundingBox()).width
  await p.getByRole('button',{name:'收起商店',exact:true}).tap()
  assert.ok((await p.locator('.garden-board').boundingBox()).width>oldWidth+100)
  await p.screenshot({path:`${output}/wide-${width}.png`})
  await p.getByTestId('pot-60').tap();assert.match(await p.getByTestId('plant-inspector').innerText(),/100%/)
  await p.getByTestId('plant-inspector').getByRole('button',{name:'收获',exact:true}).tap()
  assert.match(await p.getByTestId('plant-inspector').innerText(),/空花盆/)
  await p.getByRole('button',{name:'关闭植物信息'}).tap();assert.equal(await p.getByTestId('plant-inspector').isVisible(),false)
  await p.getByRole('button',{name:'上一座花园'}).tap();await p.getByRole('button',{name:'下一座花园'}).tap()
  await p.close()
  s=newGame();s.coins=1000;p=await open(s)
  await p.getByRole('button',{name:/花盆 \+1/}).tap();assert.equal(await p.locator('.pot').count(),5)
  await p.getByRole('button',{name:'收起商店',exact:true}).tap()
  await p.getByRole('button',{name:'扩建第6个花盆',exact:true}).tap()
  assert.equal(await p.getByRole('button',{name:/花盆 \+1/}).isVisible(),true)
  await p.getByRole('button',{name:'← 返回花园',exact:true}).tap()
  assert.equal(await p.locator('.upgrade-panel').isVisible(),false)
  await p.setViewportSize({width:390,height:844})
  assert.equal(await p.locator('.mobile-nav').isVisible(),true)
  await p.locator('.mobile-nav').getByRole('button',{name:'商店',exact:true}).tap()
  assert.equal(await p.locator('.upgrade-panel').isVisible(),true)
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width} × ${height}`)
 }
}finally{await browser.close()}
