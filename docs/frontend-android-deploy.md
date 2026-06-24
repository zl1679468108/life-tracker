# 前端 Android 部署指南

本文档指导如何将 LifeTracker 前端部署为 Android 应用。

## 1. 部署方案选择

LifeTracker 支持两种 Android 部署方式：

### 方案 A: EAS Build (推荐)
- 使用 Expo Application Services (EAS)
- 无需本地 Android 开发环境
- 云端构建，支持 APK 和 AAB 格式
- 已配置 `eas.json`

### 方案 B: 本地构建
- 需要完整的 Android 开发环境
- 需要 Android Studio、JDK、Android SDK
- 适合需要深度定制的场景

## 2. 方案 A: EAS Build 部署

### 2.1 安装 EAS CLI

```bash
npm install -g eas-cli
```

### 2.2 登录 Expo 账号

```bash
eas login
```

### 2.3 配置项目

```bash
cd frontend
eas build:configure
```

### 2.4 构建 APK (测试用)

```bash
eas build --platform android --profile preview
```

构建完成后会提供下载链接。

### 2.5 构建 AAB (发布用)

```bash
eas build --platform android --profile production
```

AAB 格式用于发布到 Google Play Store。

### 2.6 提交到 Google Play

```bash
eas submit --platform android
```

需要配置 Google Play Service Account（参考 `eas.json` 中的 `serviceAccountKeyPath`）。

## 3. 方案 B: 本地构建

### 3.1 环境准备

1. 安装 Android Studio
2. 安装 JDK 17 或更高版本
3. 安装 Android SDK (API 33+)
4. 配置环境变量：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3.2 生成原生项目

```bash
cd frontend
npx expo prebuild --platform android
```

这会在 `android/` 目录生成原生项目。

### 3.3 配置签名

创建 `android/app/keystores/release.keystore`：

```bash
keytool -genkey -v -keystore release.keystore -alias lifetracker -keyalg RSA -keysize 2048 -validity 10000
```

在 `android/app/build.gradle` 中配置签名：

```gradle
android {
    signingConfigs {
        release {
            storeFile file('keystores/release.keystore')
            storePassword 'your_password'
            keyAlias 'lifetracker'
            keyPassword 'your_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 3.4 构建 APK

```bash
cd android
./gradlew assembleRelease
```

APK 位于 `android/app/build/outputs/apk/release/app-release.apk`

### 3.5 构建 AAB

```bash
cd android
./gradlew bundleRelease
```

AAB 位于 `android/app/build/outputs/bundle/release/app-release.aab`

## 4. app.json 配置说明

当前 `app.json` 中的 Android 配置：

```json
{
  "android": {
    "adaptiveIcon": {
      "backgroundColor": "#E6F4FE",
      "foregroundImage": "./assets/images/android-icon-foreground.png",
      "backgroundImage": "./assets/images/android-icon-background.png",
      "monochromeImage": "./assets/images/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  }
}
```

### 4.1 添加包名（发布前必须）

```json
{
  "android": {
    "package": "com.lifetracker.app"
  }
}
```

### 4.2 添加版本号

```json
{
  "android": {
    "versionCode": 1
  }
}
```

### 4.3 添加权限

```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "INTERNET"
    ]
  }
}
```

## 5. 测试安装

### 5.1 安装 APK

```bash
adb install app-release.apk
```

或通过 USB 传输到设备手动安装。

### 5.2 测试清单

- [ ] 应用安装成功
- [ ] 启动画面正常显示
- [ ] 登录/注册功能正常
- [ ] 物品 CRUD 功能正常
- [ ] 待办 CRUD 功能正常
- [ ] 图片上传正常（拍照/相册）
- [ ] 推送通知正常
- [ ] 深色模式正常
- [ ] 离线模式正常
- [ ] 数据同步正常

## 6. 发布到 Google Play

### 6.1 准备商店资料

1. 应用图标：512x512 PNG
2. 功能图：1024x500 PNG
3. 截图：至少 2 张，16:9 或 9:16
4. 应用描述：简短描述（80字符）+ 完整描述（4000字符）
5. 隐私政策 URL

### 6.2 创建应用

1. 访问 Google Play Console
2. 创建新应用
3. 填写应用信息
4. 上传 AAB 文件
5. 填写商店资料
6. 设置定价和分发
7. 提交审核

### 6.3 审核时间

通常 1-3 天，首次提交可能需要更长时间。

## 7. 环境变量配置

发布前需要更新 API 地址：

### eas.json 环境变量

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.lifetracker.com",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  }
}
```

## 8. 版本更新

### 8.1 更新版本号

修改 `app.json`：

```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

### 8.2 重新构建

```bash
eas build --platform android --profile production
```

### 8.3 提交更新

```bash
eas submit --platform android
```

## 9. 常见问题

### Q: 构建失败？

A: 检查：
- Expo 账号是否登录
- eas.json 配置是否正确
- 网络连接是否正常
- 项目依赖是否安装完整

### Q: APK 安装失败？

A: 检查：
- 是否开启"允许安装未知来源应用"
- 签名是否正确
- Android 版本是否兼容

### Q: 推送通知不工作？

A: 检查：
- 是否配置 Firebase Cloud Messaging
- 是否请求通知权限
- 后端是否正确发送通知

### Q: 图片上传失败？

A: 检查：
- 是否请求存储权限
- API 地址是否正确
- 网络连接是否正常

## 10. 性能优化

### 10.1 启用 Hermes

在 `app.json` 中添加：

```json
{
  "android": {
    "jsEngine": "hermes"
  }
}
```

### 10.2 启用 ProGuard

在 `android/app/build.gradle` 中：

```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 10.3 启用 APK 拆分

减小 APK 体积，按 ABI 拆分：

```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        universalApk false
    }
}
```

## 11. 监控和崩溃报告

建议集成以下服务：

1. **Sentry**: 错误追踪和性能监控
2. **Firebase Analytics**: 用户行为分析
3. **Firebase Crashlytics**: 崩溃报告

## 12. 部署后验证清单

- [ ] 应用安装成功
- [ ] 启动画面正常
- [ ] 登录/注册功能正常
- [ ] 物品 CRUD 功能正常
- [ ] 待办 CRUD 功能正常
- [ ] 图片上传正常
- [ ] 推送通知正常
- [ ] 深色模式正常
- [ ] 离线模式正常
- [ ] 数据同步正常
- [ ] 崩溃报告正常
- [ ] 性能表现良好

## 13. 相关文档

- [EAS Build 文档](https://docs.expo.dev/build/)
- [Android 部署文档](https://docs.expo.dev/distribution/building-standalone-apps/#android)
- [Google Play 发布指南](https://support.google.com/googleplay/android-developer/answer/113469)
