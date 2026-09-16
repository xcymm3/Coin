import {campaign} from './campaign-check.mjs'
for(const interval of [1,2,3,5])for(const seed of [1,42,2026,1001,1004,1015]){
 const r=campaign(seed,interval)
 console.log(JSON.stringify({...r,buys:undefined,windows:undefined}))
}
