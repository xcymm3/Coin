# Android APK

应用名：月光奇植园。包名：`com.moonlitgarden.game`。

游戏静态资源随 APK 打包，无需启动 Vite 或连接网站。入口 Activity 固定 `portrait`，应用分类为 `game`。系统状态栏、刘海及导航栏由 Capacitor 的原生安全区处理。

## 构建

需要 Node.js 22+、JDK 21、Android SDK（API 36）及 SDK 许可证。设置 `JAVA_HOME`、`ANDROID_HOME`，或在不提交的 `android/local.properties` 中指定 `sdk.dir`。

```powershell
corepack pnpm install --frozen-lockfile
npm run build:android
```

脚本会以根路径构建网页资源、同步至原生工程，再运行 `assembleDebug`，输出：

`.artifacts/apk/moonlit-garden-1.0-portrait-debug.apk`

这是使用本机 Android 调试证书签名、可直接安装的测试包，不是应用商店发布包。后续覆盖安装须保持包名和签名一致；不要卸载已有应用来升级，否则可能丢失本地存档。浏览器版和 APK 的存档各自独立。

正式上架时需配置发布签名并增加 `versionCode`；密钥、SDK 路径及 APK 不提交进 Git。

参考：[Capacitor 安卓开发](https://capacitorjs.com/docs/android)、[固定屏幕方向](https://capacitorjs.com/docs/guides/screen-orientation)。
