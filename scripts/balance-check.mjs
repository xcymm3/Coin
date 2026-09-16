import {newGame,reducer,PLANTS,UPGRADES,unlocked,price,upgradePrice,upgradeLock} from '../src/game.ts'
for(const seed of [1,42,123,2026,65535]) {
 let s=reducer(newGame(),{type:'start'});s.randomState=seed;let starAt=null;const milestones={}
 const goals=[['click',1],['snail',1],['pots',2],['water',1],['speed',1],['harvest',1],['sow',1],['soil',1]]
 for(let t=0;t<1500&&s.wonAt===null;t++) {
  const star=s.pots.findIndex(p=>p.plant===9)
  if(unlocked(s,3)&&star<0&&s.coins>=6500) {
   let i=s.pots.findIndex(p=>p.plant===null)
   if(i<0)i=s.pots.findIndex(p=>p.plant!==null&&p.growth>=PLANTS[p.plant].seconds)
   if(i>=0){if(s.pots[i].plant!==null)s=reducer(s,{type:'pot',index:i});s=reducer(s,{type:'select',id:9});s=reducer(s,{type:'pot',index:i});starAt=t}
  }
  s=reducer(s,{type:'select',id:unlocked(s,2)?6:unlocked(s,1)?3:0})
  for(let click=0;click<(t%3===0?1:0);click++) {
   let i=t%6===0?s.pots.findIndex(p=>p.plant===9):-1
   if(i<0)i=s.pots.findIndex(p=>p.plant!==null&&p.plant!==9&&p.growth>=PLANTS[p.plant].seconds)
   if(i<0&&s.coins>=price(s,PLANTS[s.selected]))i=s.pots.findIndex(p=>p.plant===null)
   if(i<0)i=s.pots.findIndex(p=>p.plant!==null&&p.plant!==9&&!s.discovered.includes(p.plant))
   if(i<0)i=s.pots.findIndex(p=>p.plant!==null&&p.plant!==9&&p.growth<PLANTS[p.plant].seconds)
   if(i<0){i=s.pots.findIndex(p=>p.plant===null);if(i>=0)s=reducer(s,{type:'select',id:0})}
   if(i>=0) {const p=s.pots[i];s=reducer(s,p.plant!==null&&p.growth<PLANTS[p.plant].seconds&&s.player.stock===0?{type:'refill'}:p.plant!==null&&p.growth<PLANTS[p.plant].seconds?{type:'water',index:i}:{type:'pot',index:i})}
  }
  const goal=goals.find(([id,n])=>s.upgrades[id]<n&&!upgradeLock(s,id))
  if(goal&&(!unlocked(s,2)||starAt!==null)) {const u=UPGRADES.find(u=>u.id===goal[0]);if(s.coins>=upgradePrice(s,u))s=reducer(s,{type:'buy',id:u.id})}
  for(const id of ['snail','water','speed','harvest','sow'])if(s.upgrades[id]&&!milestones[id])milestones[id]=t
  s=reducer(s,{type:'tick',dt:1})
 }
 console.log(JSON.stringify({seed,starAt,wonAt:s.wonAt,harvests:s.harvests,milestones}))
}
