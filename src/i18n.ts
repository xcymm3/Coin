import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUI from './locales/en-US.json'

const zh = {
  data: {
    tiers: ['普通种子','稀有种子','珍贵种子','超凡种子','神话种子','远古种子','星界种子','终极种子'],
    tierShorts: ['普通','稀有','珍贵','超凡','神话','远古','星界','终极'],
    gardens: [
      {name:'苔庭温室',subtitle:'雨后的泥土与嫩芽'}, {name:'萤火溪谷',subtitle:'溪水绕过发光的蘑菇'},
      {name:'琥珀沙庭',subtitle:'暖风与金色的石阶'}, {name:'极光雪苑',subtitle:'冰晶映着缓缓流动的极光'},
      {name:'星海天台',subtitle:'在星轨下种出最后一朵花'},
    ],
    plants: ['嫩芽豆','红伞菇','蜜桃郁金香','水滴花','月光兰','太阳金币花','贪吃捕蝇草','星霜水晶花','紫铃梦境草','永恒星之花','金穗铃兰','琥珀灯笼果','翡翠龙舌兰','珊瑚焰花','雷鸣竹','极光羽蕨','夜空莲','凤凰冠花','时光沙漏兰','银河螺旋树','日冕圣莲','琥珀蕨','龙骨藤','化石树','始祖莲','彗尾草','星环菇','月蚀铃','宇宙之心'],
    variants: {'10':'银铃结霜','11':'萤灯双生','12':'紫晶王冠','16':'月下蝶莲','20':'黑曜日冕','24':'龙眠古莲','28':'双星共鸣'},
    decorations: {bunting:'叶色彩旗',fence:'白木围栏',mushrooms:'蘑菇小径',lights:'暖星灯串',fountain:'月泉摆件',moon:'星月风铃'},
    weather: {names:['细雨','萤火虫之夜','彩虹'],effects:['自然成长 ×2','收获收益 ×7','水壶无限水量']},
    waterStates: ['空壶','将空','半满','满水'],
    crew: {water:'浇水蜗牛',harvest:'收获甲虫',sow:'播种松鼠'},
    materials: ['木制','铜制','铁制','金质','钻石制'],
  },
  dynamic: {
    insufficientCoins:'金币不足 · 需要 {{amount}}', nextGarden:'下一座花园 · {{name}}', openGarden:'开辟{{name}} · {{status}}', openCost:'花费 {{amount}} 金币',
    offlineWelcome:'离线照料了 {{time}}，欢迎回到花园。', seedInsufficient:'金币不足：{{tier}}需要 {{amount}} 金币。普通种子始终免费。',
    cannotOpen:'暂不能开辟{{name}} · {{reason}}', gardenOpened:'{{name}}已开辟', squirrelChoice:'松鼠播种选种，当前{{tier}}', squirrelsSow:'本园松鼠播种：{{tier}}',
    seedPrice:'{{amount}} 金币', harvestedCount:'{{count}} / 4 已收获', waterToolTitle:'水壶 · {{state}}。点击选择水壶；到花园左下角的水池打水。', waterToolLabel:'水壶工具 · {{state}}',
    seedShortcut:'{{tier}}，{{price}}{{short}}', cartSelected:'已选 {{garden}} · {{pot}} 号盆，可跨园搬运；再点小推车取消', currentEffects:'当前收获加成 {{harvest}} 倍，生长速度 {{growth}} 倍',
    buyPot:'购买第{{pot}}个花盆，{{amount}}金币', potAdded:'已添加第 {{pot}} 个花盆', coinReward:'+{{amount}} 金币',
    plantReady:'{{plant}} · 已成熟，点击收获 · 收获 {{amount}} 金币', plantGrowing:'{{plant}} · 成长 {{percent}}% · 收获 {{amount}} 金币', roamingSnails:'{{count}} 只蜗牛在园中漫游',
    harvestUpgrade:'本次升级：收获 ×{{multiplier}}（+{{percent}}%）', menuReturn:'返回 {{garden}} · {{time}}', menuSummary:'{{count}} 种奇植 · 五座花园 · 一颗终点的星',
    seedEach:'{{amount}} 金币 / 颗', oldHarvests:'旧存档的 {{count}} 次收获未记录品种；各品种次数从本次更新后开始累计。',
    workerState:'{{name}}{{index}} · {{material}}装备：{{state}}', weatherLabel:'{{name}}天气，{{effect}}，剩余{{seconds}}秒', notEnoughSuffix:'，金币不足',
  },
  locks: {
    earned:'累计获得 {{amount}} 金币后开放', localHarvest:'本园收获 {{current}}/{{required}} 株后开放', gardenHarvest:'第{{garden}}园收获 {{current}}/{{required}} 株后开放', settling:'团队磨合中 {{time}}',
    improveHarvest:'先提升丰收研究或前往高收益花园', keepPlaying:'继续经营花园后开放', expandPots:'先将最新花园扩至15盆', completeResearch:'先完成最新花园解锁的研究', previousHarvest:'先完成上一级丰收研究',
  },
  research: {harvest:'丰收研究 {{level}}级',soil:'沃土研究 {{level}}级',infusion:'灌注研究 {{level}}级',soilDetail:'本次升级：生长速度 ×2',infusionDetail:'本次升级：浇水成长 ×2，容量 ×2'},
  hire: {recruit:'雇佣第 {{level}} 只{{crew}}',equipment:'{{material}}{{gear}}',add:'本园新增 1 名助手',waterGear:'浇水、容量 ×2，速度提升',otherGear:'容量 ×2，速度提升',tank:'水箱',basket:'背筐',seedBag:'种子袋'},
  worker: {rest:'休息中',return:'返回补给站',deliver:'交付收获',refill:'装填补给',act:'正在照料',walk:'前往花盆',idle:'等待目标'},
  pot: {aria:'花盆{{pot}} {{plant}} {{action}}',empty:'空闲',sow:'播种',fertilize:'施肥',remove:'挖除',selectMove:'选择移动',moveHere:'移动到此处',harvest:'收获',useCan:'使用水壶',growing:'生长中'},
  inspector: {label:'植物信息',close:'关闭植物信息',emptyTitle:'第 {{pot}} 盆 · 空花盆',emptyPrompt:'点击花盆种下{{tier}}',progress:'成长 {{percent}}% · {{status}}',ready:'已成熟',harvest:'收获',selectCan:'选水壶',details:'点击植物查看详情',detailsHint:'名称、成长与收益显示在这里',waterSelected:'水壶已选中，点击植物浇水',harvestToast:'{{plant}} · 收获 +{{amount}}'},
  shop: {tabs:['升级','雇佣','装饰'],mobileTabs:['花园','种子','商店'],decorOnly:'{{detail}} · 仅本园外观'},
  help: {
    title:'园丁的小手册', chooseTitle:'选种、播种', choose:'八档种子依次为普通、稀有、珍贵、超凡、神话、远古、星界、终极。前七档各有四种植物，普通种子免费；各档均能抽到全部二十八种非终极植物，终极种子固定种出星之花。播种后立即显示品种名称、对应幼芽和成长进度，并直接开始生长；挖除不退种子费用。',
    waterTitle:'浇水、收获', water:'植物会自然生长。不同品种会长出不同幼芽。种子与工具可以同时保持选中：点击空盆会播种当前种子，点击已有植物才会使用水壶、铲子或肥料。浇水会播放 1.2 秒动画，期间该株无法重复浇水，但可以同时浇其他植物；需要补水时，点击花园左下角的水池。手机默认点击植物查看下方资料，再点“收获”按钮采收；PC 默认点击成熟植物直接收获。铲子可挖除任何阶段的植物，且不获得金币或收获次数。再次点击已选工具可取消选择。选择小推车后先点植物，可用花园左右箭头切换花园，再点空盆搬运或另一株植物交换位置；成长进度和外观变体会保留。只有手动收获有 5% 概率获得肥料，甲虫自动收获不掉落肥料。肥料可让未成熟的非终极植物立即成熟。植物没有额外特殊效果；进度满后再次点击收获金币。',
    expandTitle:'扩建、雇用助手', expand:'商店分为升级、雇佣、装饰，只列出尚未购买的选项。全园共用丰收、沃土和灌注三条研究路线。每座新花园解锁后续研究，丰收研究使用连续整数等级；未解锁的下一等级灰显并标明条件，切园不改变研究列表，效果对全园生效。每次招募或装备升级后有45秒磨合期，后续项目还需完成本园收获目标。每座花园独立雇佣蜗牛、甲虫和松鼠，每种最多五只；木制装备可依次强化为铜制、铁制、金质、钻石制，仅影响本园同种动物。新园不会自动获得动物或装饰。雇佣松鼠后，可在花园顶部为本园指定播种种子；金币或收益条件不足时松鼠等待，满足后自动继续，不会改种其他种子。甲虫运回金币，蜗牛回池补水。每园从4个花盆开始，点击花园内标价的＋号直接购买，每次增加1盆，最多15盆。最新花园扩至15盆并完成该园解锁的全部研究后，点击花园右侧带“＋”的箭头付费开辟下一园。',
    starTitle:'种出第一颗星星', star:'普通到星界种子同时检查金币与常态收益条件，天气不会临时解锁种子；单株收获可能亏损，允许播种的常规种子在当前花园的常态期望净收益始终为正，变种与天气收益另算。终极种子价格 {{cost}} 金币，不要求研究数量或花园数量。星之花基础成长需450分钟，在第五园完成成长研究后自然成熟约5.6分钟，配合浇水约5分钟；每5秒可吸收一次浇水，与其他植物一样接受手动浇水、蜗牛浇水、土壤加成。成熟即通关，之后可以继续种植。',
    note:'装饰仅改变本园外观，高级花园价格更高；购买后可在设置中隐藏。每隔 5–10 分钟出现一次细雨、萤火虫之夜或彩虹，持续 15 秒：细雨使全园植物自然成长速度翻倍；萤火虫之夜使手动和自动收获收益 ×7，按采摘时刻结算；彩虹期间玩家水壶不耗水，空壶也能使用，结束后恢复原有水量。星之花不会被自动收获或自动播种。可关闭自动收获，保留喜欢的植物观赏。所有浇水只作用于单株植物。水壶空了请点击左下角水池打水。观赏模式保留音乐和自动照料，隐藏数值提示与通关弹窗。', done:'知道了',
  },
  book: {genericLore:'月光花园里的一株奇妙植物。'},
}

const en = {
  ...enUI,
  '关闭菜单': 'Close menu',
  data: {
    tiers: ['Common Seed','Rare Seed','Precious Seed','Exotic Seed','Mythic Seed','Ancient Seed','Astral Seed','Ultimate Seed'],
    tierShorts: ['Common','Rare','Precious','Exotic','Mythic','Ancient','Astral','Ultimate'],
    gardens: [
      {name:'Mosslight Conservatory',subtitle:'Tender shoots in rain-washed soil'}, {name:'Firefly Brook',subtitle:'A stream winds past luminous mushrooms'},
      {name:'Amber Sand Court',subtitle:'Warm wind over golden stone steps'}, {name:'Aurora Snow Garden',subtitle:'Ice crystals mirror the drifting aurora'},
      {name:'Astral Terrace',subtitle:'Grow the final flower beneath the stars'},
    ],
    plants: ['Tender Bean','Redcap Mushroom','Peach Tulip','Dewdrop Bloom','Moon Orchid','Sun Coinflower','Gentle Flytrap','Starfrost Crystal','Violet Dreambell','Eternal Starflower','Golden Lilybell','Amber Lanternberry','Emerald Agave','Coral Flamebloom','Thunder Bamboo','Aurora Fern','Night-Sky Lotus','Phoenix Crown','Hourglass Orchid','Spiral Galaxy Tree','Corona Lotus','Amber Fern','Dragonbone Vine','Fossil Tree','First Lotus','Comet-Tail Grass','Ringstar Mushroom','Eclipse Bell','Heart of the Cosmos'],
    variants: {'10':'Frosted Silver Bells','11':'Twin Firefly Lanterns','12':'Amethyst Crown','16':'Moonlit Butterfly Lotus','20':'Black-Sun Corona','24':'Dragon-Sleep Lotus','28':'Twin-Star Resonance'},
    decorations: {bunting:'Leaf Bunting',fence:'Whitewood Fence',mushrooms:'Mushroom Path',lights:'Warm Star Lights',fountain:'Moonwell Ornament',moon:'Star-Moon Chime'},
    weather: {names:['Soft Rain','Firefly Night','Rainbow'],effects:['Natural growth ×2','Harvest value ×7','Infinite watering can']}, waterStates:['Empty','Low','Half','Full'],
    crew: {water:'Watering Snail',harvest:'Harvest Beetle',sow:'Sowing Squirrel'}, materials:['Wooden','Copper','Iron','Gold','Diamond'],
  },
  dynamic: {
    insufficientCoins:'Not enough coins · Need {{amount}}', nextGarden:'Next garden · {{name}}', openGarden:'Open {{name}} · {{status}}', openCost:'Costs {{amount}} coins',
    offlineWelcome:'Your helpers tended the garden for {{time}}. Welcome back.', seedInsufficient:'Not enough coins: {{tier}} costs {{amount}} coins. Common Seeds are always free.',
    cannotOpen:'Cannot open {{name}} yet · {{reason}}', gardenOpened:'{{name}} opened', squirrelChoice:'Squirrel seed choice, currently {{tier}}', squirrelsSow:'Squirrels sow: {{tier}}',
    seedPrice:'{{amount}} coins', harvestedCount:'{{count}} / 4 harvested', waterToolTitle:'Watering can · {{state}}. Select it, then refill at the pool.', waterToolLabel:'Watering can · {{state}}',
    seedShortcut:'{{tier}}, {{price}}{{short}}', cartSelected:'Selected {{garden}} · Pot {{pot}}; change gardens to move it', currentEffects:'Current harvest multiplier {{harvest}}, growth speed {{growth}}',
    buyPot:'Buy pot {{pot}} for {{amount}} coins', potAdded:'Pot {{pot}} added', coinReward:'+{{amount}} coins',
    plantReady:'{{plant}} · Ready to harvest · {{amount}} coins', plantGrowing:'{{plant}} · {{percent}}% grown · {{amount}} coins', roamingSnails:'{{count}} snails roam this garden',
    harvestUpgrade:'This upgrade: harvest ×{{multiplier}} (+{{percent}}%)', menuReturn:'Return to your garden · {{time}}', menuSummary:'{{count}} plants · Five gardens · One final star',
    seedEach:'{{amount}} coins each', oldHarvests:'{{count}} harvests from an older save have no species record; counts begin with this version.',
    workerState:'{{name}} {{index}} · {{material}} gear: {{state}}', weatherLabel:'{{name}}, {{effect}}, {{seconds}} seconds left', notEnoughSuffix:', not enough coins',
  },
  locks: {
    earned:'Earn {{amount}} coins in total to unlock', localHarvest:'Harvest {{current}}/{{required}} plants here to unlock', gardenHarvest:'Harvest {{current}}/{{required}} plants in garden {{garden}} to unlock', settling:'Team settling in {{time}}',
    improveHarvest:'Improve Harvest Study or move to a richer garden', keepPlaying:'Keep tending the garden to unlock', expandPots:'Expand the newest garden to 15 pots first', completeResearch:'Complete the newest garden studies first', previousHarvest:'Complete the previous Harvest Study first',
  },
  research: {harvest:'Harvest Study Lv. {{level}}',soil:'Soil Study Lv. {{level}}',infusion:'Infusion Study Lv. {{level}}',soilDetail:'This upgrade: growth speed ×2',infusionDetail:'This upgrade: watering growth ×2 · capacity ×2'},
  hire: {recruit:'Hire {{crew}} {{level}}',equipment:'{{material}} {{gear}}',add:'Adds 1 helper here',waterGear:'Watering and capacity ×2; faster',otherGear:'Capacity ×2; faster',tank:'Tank',basket:'Basket',seedBag:'Seed Bag'},
  worker: {rest:'Resting',return:'Returning to station',deliver:'Delivering harvest',refill:'Refilling supplies',act:'Tending',walk:'Walking to a pot',idle:'Waiting'},
  pot: {aria:'Pot {{pot}} {{plant}} {{action}}',empty:'Empty',sow:'Sow',fertilize:'Fertilize',remove:'Remove',selectMove:'Select to move',moveHere:'Move here',harvest:'Harvest',useCan:'Use watering can',growing:'Growing'},
  inspector: {label:'Plant information',close:'Close plant information',emptyTitle:'Pot {{pot}} · Empty',emptyPrompt:'Click the pot to sow {{tier}}',progress:'Growth {{percent}}% · {{status}}',ready:'Ready',harvest:'Harvest',selectCan:'Select can',details:'Select a plant for details',detailsHint:'Its name, growth, and value appear here',waterSelected:'Watering can selected; click the plant to water',harvestToast:'{{plant}} · Harvest +{{amount}}'},
  shop: {tabs:['Studies','Helpers','Decor'],mobileTabs:['Garden','Seeds','Shop'],decorOnly:'Changes this garden’s appearance only'},
  help: {
    title:'Gardener’s handbook', chooseTitle:'Choose and sow', choose:'Start with free Common Seeds. New seed tiers appear as your lifetime earnings grow. Each regular tier can reveal plants from across the collection, while the Ultimate Seed always grows the Starflower.',
    waterTitle:'Water and harvest', water:'A seed and a tool can stay selected together: empty pots sow, occupied pots use the chosen tool. Refill at the lower-left pool. Mature plants are clearly marked and can be harvested for coins; individual results may be a gain or a loss, but every unlocked regular seed keeps a positive expected return.',
    expandTitle:'Expand and hire', expand:'Buy studies, hire up to five snails, beetles, and squirrels per garden, and improve their equipment. Each garden starts with four pots and expands to fifteen. Complete its studies, then use the right arrow to open the next garden.',
    starTitle:'Grow a star', star:'The Ultimate Seed costs {{cost}} coins. Grow its Starflower to finish the journey, then continue in free play.',
    note:'Weather visits every 5–10 minutes for 15 seconds. Soft Rain doubles natural growth, Firefly Night multiplies harvest value by seven, and Rainbows give the player infinite water. Menus pause the garden; autosave and offline growth are enabled.', done:'Got it',
  },
  book: {genericLore:'A curious plant from the moonlit garden.'},
}

let savedLanguage = 'zh'
try { savedLanguage = JSON.parse(localStorage.getItem('moon-garden-settings') ?? '{}').language === 'en' ? 'en' : 'zh' } catch { /* Use Chinese when settings are unavailable. */ }

void i18n.use(initReactI18next).init({resources:{zh:{translation:zh},en:{translation:en}},lng:savedLanguage,fallbackLng:'zh',interpolation:{escapeValue:false}})

export default i18n
