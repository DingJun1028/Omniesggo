# Tencent RTC TUIKit — Android (Kotlin/Java)

## Gradle
```gradle
implementation 'com.tencent.imsdk:imsdk-plus:latest.release'
implementation 'com.tencent.qcloud.tuikit:chat:latest.release'
```

## 初始化 (Kotlin)
```kotlin
val config = V2TIMSDKConfig()
V2TIMManager.getInstance().initSDK(context, YOUR_APP_ID, config)
```
