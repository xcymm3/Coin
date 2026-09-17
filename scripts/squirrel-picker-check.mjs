import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {expanded,employ} from '../tests/helpers.mjs'
import {SAVE_KEY,PLANTS} from '../src/game.ts'
const {chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const b=await chromium.launch();mkdirSync('.artifacts/squirrel-picker',{recursive:true})
try{
for(const [name,width,height] of [['android',390,844],['desktop',1440,1000]]){
 const p=await b.newPage({...name==='android'?devices['Pixel 7']:{},viewport:{width,height},deviceScaleFactor:1})
 let s=expanded();s.activeGarden=2;s=employ(s,'sow');s.gardens[2].autoSow=false;s.coins=12560000;s.elapsed=100;s.weather={kind:0,started:-100,next:500}
 for(let i=30;i<45;i++)s.pots[i]={plant:10+i%8,growth:PLANTS[10+i%8].seconds*.7,wateredAt:-10}
 await p.addInitScript(({s,key})=>localStorage.setItem(key,JSON.stringify({...s,lastSaved:Date.now()})),{s,key:SAVE_KEY})
 await p.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5174/');await p.getByRole('button',{name:'继续我的花园'}).click()
 const trigger=p.locator('.zen-garden .squirrel-picker-button')
 await trigger.click();let dialog=p.getByRole('dialog',{name:'松鼠播种选种'})
 assert.equal(await dialog.getByRole('button',{name:/终极/}).count(),0)
 await dialog.getByRole('button',{name:/^珍贵种子/}).click()
 assert.equal(await dialog.count(),0);assert.match(await trigger.getAttribute('aria-label'),/珍贵种子/)
 assert.equal(await p.locator('.seed-panel .tier-0').getAttribute('aria-pressed'),'true')
 await p.screenshot({animations:'disabled',path:`.artifacts/squirrel-picker/${name}-garden.png`})
 await trigger.click();await p.screenshot({animations:'disabled',path:`.artifacts/squirrel-picker/${name}-dialog.png`})
 assert.equal(await dialog.getByRole('button',{name:/^珍贵种子/}).getAttribute('aria-pressed'),'true')
 await p.keyboard.press('Escape');assert.equal(await dialog.count(),0)
 assert.match(await trigger.getAttribute('aria-label'),/珍贵种子/)
 await p.getByRole('button',{name:'上一座花园'}).click();assert.equal(await trigger.count(),0)
 await p.getByRole('button',{name:'下一座花园'}).click();assert.match(await trigger.getAttribute('aria-label'),/珍贵种子/)
 console.log(`PASS ${name}: modal selection, badge, manual seed isolation, cancel and garden isolation`)
 await p.close()
}
}finally{await b.close()}
