// Run against a local Vite server. PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {newGame,PLANTS,reducer,SAVE_KEY} from '../src/game.ts'
import {expanded,employ} from '../tests/helpers.mjs'
const {chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch({headless:true})
const output='.artifacts/mobile-layout'
mkdirSync(output,{recursive:true})
const results=[]
try {
 for(const [width,height] of [[320,640],[360,800],[375,812],[414,896],[768,1024]]){
  const context=await browser.newContext({...devices['Pixel 7'],viewport:{width,height},deviceScaleFactor:1})
  const errors=[]
  async function open(state){
   const page=await context.newPage()
   page.on('pageerror',e=>errors.push(e.message))
   await page.addInitScript(({state,key})=>localStorage.setItem(key,JSON.stringify({...state,lastSaved:Date.now()})),{state,key:SAVE_KEY})
   await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/')
   await page.getByRole('button',{name:/开始种植|继续我的花园/}).tap()
   return page
  }
  let s=newGame();s.coins=1000
  s.pots[0]={plant:10,growth:PLANTS[10].seconds,wateredAt:-10}
  s.pots[1]={plant:9,growth:100,wateredAt:-10}
  let page=await open(s)
  const inspector=page.getByTestId('plant-inspector')
  await page.getByTestId('pot-0').tap()
  assert.match(await inspector.innerText(),/金穗铃兰/)
  assert.match(await inspector.innerText(),/100%/)
  await inspector.getByRole('button',{name:'收获',exact:true}).tap()
  assert.match(await inspector.innerText(),/空花盆/)
  const nav=page.getByRole('navigation',{name:'游戏面板'})
  const expand=page.getByTestId('buy-pot')
  const purchaseBox=await expand.boundingBox()
  assert.ok(purchaseBox.y+purchaseBox.height<height,'expansion visible without scrolling')
  await page.screenshot({path:`${output}/expansion-${width}.png`,fullPage:true})
  await expand.tap()
  assert.equal(await page.locator('[data-testid^="pot-"]').count(),5)
  await nav.getByRole('button',{name:'种子',exact:true}).tap()
  await page.getByRole('button',{name:/稀有种子/}).first().tap()
  assert.equal(await page.getByRole('region',{name:'花园',exact:true}).isVisible(),true)
  await page.getByTestId('pot-1').tap()
  await inspector.getByRole('button',{name:'选水壶',exact:true}).tap()
  await page.getByTestId('pot-1').tap()
  await page.locator('.tool-pour').waitFor()
  await page.close()

  s=expanded();s=employ(s,'sow');s.coins=1e12;s.elapsed=100
  s.weather={kind:1,started:100,next:500}
  for(let i=60;i<75;i++)s.pots[i]={plant:i===61?9:10+i%3,growth:i===61?100:PLANTS[10+i%3].seconds*.3,wateredAt:-10}
  page=await open(s)
  const quick=page.getByRole('group',{name:'快捷选种'})
  const picker=page.locator('.zen-garden .squirrel-picker-button')
  const sowTier=await picker.getAttribute('aria-label')
  await page.getByRole('button',{name:/水壶工具/}).tap()
  const lastSeed=quick.getByRole('button').last()
  await lastSeed.scrollIntoViewIfNeeded()
  await lastSeed.tap()
  assert.equal(await lastSeed.getAttribute('aria-pressed'),'true')
  assert.equal(await picker.getAttribute('aria-label'),sowTier,'manual seed choice preserves squirrel tier')
  assert.equal(await page.getByRole('button',{name:/水壶工具/}).getAttribute('aria-pressed'),'false')
  assert.equal(await page.getByRole('region',{name:'花园',exact:true}).isVisible(),true)
  assert.ok(await quick.evaluate(e=>e.scrollWidth>e.clientWidth || e.clientWidth>600),'seed strip scrolls on phones')
  await page.getByTestId('pot-61').tap()
  assert.match(await page.getByTestId('plant-inspector').innerText(),/永恒星之花/)
  await page.getByRole('button',{name:'上一座花园'}).tap()
  await page.getByRole('button',{name:'下一座花园'}).tap()
  await page.getByTestId('pot-61').tap()
  const metrics=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {width:r.width,height:r.height,bottom:r.bottom}}
   return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,pool:rect('.pool-refill-button'),info:rect('.mobile-plant-info'),arrow:rect('.scene-prev'),help:rect('[aria-label="玩法指南"]'),picker:rect('.zen-garden .squirrel-picker-button')}
  })
  assert.equal(metrics.scrollWidth,width)
  assert.ok(metrics.info.bottom<=height && metrics.pool.bottom<=height,'garden and inspector fit viewport')
  for(const key of ['arrow','help','picker'])assert.ok(metrics[key].width>=44 && metrics[key].height>=44,`${key} touch target`)
  await page.screenshot({path:`${output}/garden-${width}.png`,fullPage:true})
  await page.getByRole('navigation',{name:'游戏面板'}).getByRole('button',{name:'商店',exact:true}).tap()
  await page.screenshot({path:`${output}/shop-${width}.png`,fullPage:true})
  assert.deepEqual(errors,[])
  results.push(metrics);console.log(`PASS ${width} × ${height}`)
  await context.close()
 }
 const desktop=await browser.newPage({viewport:{width:1440,height:1000}})
 const s=newGame();s.coins=1000;s.pots[0]={plant:10,growth:PLANTS[10].seconds,wateredAt:-10}
 await desktop.addInitScript(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key:SAVE_KEY})
 await desktop.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/')
 await desktop.getByRole('button',{name:'开始种植'}).click()
 assert.equal(await desktop.getByTestId('plant-inspector').isVisible(),false)
 await desktop.getByTestId('pot-0').click()
 assert.match(await desktop.getByTestId('pot-0').getAttribute('aria-label'),/空闲/)
 await desktop.screenshot({path:`${output}/desktop.png`,fullPage:true})
 console.log('PASS desktop layout and direct harvest')
 writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2))
}finally{await browser.close()}
