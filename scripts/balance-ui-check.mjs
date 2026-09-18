import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {newGame,SAVE_KEY} from '../src/game.ts'
const {chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser=await chromium.launch()
mkdirSync('.artifacts/balance-ui',{recursive:true})
try{
 for(const mobile of [false,true]){
  const name=mobile?'android':'desktop'
  const page=await browser.newPage({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:1})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  const s=newGame();s.coins=10000
  await page.addInitScript(({s,key})=>localStorage.setItem(key,JSON.stringify({...s,lastSaved:Date.now()})),{s,key:SAVE_KEY})
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/')
  await page.getByRole('button',{name:/开始种植|继续我的花园/}).click()
  if(mobile)await page.getByRole('navigation',{name:'游戏面板'}).getByRole('button',{name:'商店',exact:true}).click()
  const first=page.getByTestId('upgrade-g0-profit-1')
  assert.match(await first.innerText(),/40/)
  assert.equal(await page.locator('[data-testid^="upgrade-g0-profit"]').count(),1)
  await first.click()
  const second=page.getByTestId('upgrade-g0-profit-2')
  assert.equal(await second.isDisabled(),true)
  assert.match(await second.innerText(),/0\/12/)
  assert.equal(await page.locator('.garden-bonuses').count(),0)
  assert.doesNotMatch(await page.locator('.upgrade-panel').innerText(),/第1园解锁 · 全园共享/)
  await page.screenshot({path:`.artifacts/balance-ui/${name}-research.png`,fullPage:true})
  await page.getByRole('tab',{name:'雇佣',exact:true}).click()
  assert.equal(await page.getByTestId('hire-recruit-sow-1').isDisabled(),true)
  await page.getByTestId('hire-recruit-water-1').click()
  const next=page.getByTestId('hire-recruit-water-2')
  assert.equal(await next.isDisabled(),true)
  assert.match(await next.innerText(),/0\/40/)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.screenshot({path:`.artifacts/balance-ui/${name}-team.png`,fullPage:true})
  assert.deepEqual(errors,[])
  console.log(`PASS ${name}: staged research, compact shop, local harvest gates, no overflow or page errors`)
  await page.close()
 }
}finally{await browser.close()}
