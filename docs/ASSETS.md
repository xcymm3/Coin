# 美术与音效

风格基准：用户提供的花园示意图。保留深蓝森林、木质花园、陶土花盆、粗黑描边、绿色进度条和蓝色升级面板。

## 游戏素材

以下素材通过内置 ImageGen 生成，已复制到项目内，运行时不依赖图像服务：

- `public/assets/garden-atlas.png`：4×4 透明精灵图集，前十格为十种植物，随后为空花盆、种子花盆、浇水蜗牛、种子袋、水壶、金币。CSS 使用图集坐标直接显示，不需要图片后处理。
- `public/assets/night-forest.png`：夜间森林背景。
- `public/assets/wood-texture.png`：低对比度木材像素纹理。

### 生成提示词记录

共同约束：附图仅作为风格参考；严格匹配 chunky detailed retro 16-bit pixel art、stepped pixel edges、黑色描边与高饱和点缀；不生成界面文字，不使用平滑矢量或模糊图形。

1. **精灵图集**：square transparent production game sprite atlas, strict 4 columns × 4 rows, evenly centered isolated objects, each plant in matching terracotta pot viewed slightly from above. Row 1: bean sprout, red spotted mushroom cluster, pink tulip, glowing blue water-drop flower. Row 2: white moon orchid, smiling golden coin sunflower, purple toothy carnivorous plant, blue crystal flowers. Row 3: purple bellflower, ultimate rainbow star blossom in ornate pot, empty soil pot, pot with brown seed. Row 4: orange-shell snail carrying blue watering can, beige seed sack with green leaf, blue watering can, gold coin. Transparent margins, no objects crossing cells, no text or grid lines.
2. **森林背景**：wide 16:9 midnight forest greenhouse, deep navy sky, tiny blue stars, hanging green ivy, thick side tree trunks, one glowing golden lantern upper center right, fireflies, ferns and corner mushrooms. Center mostly dark for readable game UI. No pots, board, panels or text. Cozy classic pixel RPG environment.
3. **木纹**：square tiling warm walnut wood surface matching reference central garden board, horizontal planks, subtle stepped grain streaks, sparse knots, low contrast, crisp large pixel blocks. Dominant base brown #8d5b35, grain #98663c, highlights #ab7643, shadows #784929. No borders, objects, text or gradient shading.

## 字体

Fusion Pixel Font 12px proportional（简体中文），作者 TakWolf，SIL Open Font License 1.1。

- 来源：https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.09.01
- 文件：`public/assets/garden-pixel.woff2`
- 完整许可和上游组件许可：`public/assets/font-licenses/`

## 音效

`src/audio.ts` 使用 Web Audio API 合成原创短音序：播种、浇水、收获、购买、菜单点击及通关。音效由玩家首次点击后启用，可关闭并调整音量。自动化动作保持安静，避免多个花盆连续触发刺耳音效。
