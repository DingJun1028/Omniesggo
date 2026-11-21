# Tencent RTC TUIKit — Vue 3 集成

## 安裝
```bash
npm install @tencentcloud/chat @tencentcloud/chat-uikit-vue3
```

## 初始化
```ts
import { ChatSDK } from '@tencentcloud/chat';
import { TUIChatKit } from '@tencentcloud/chat-uikit-vue3';

const chat = ChatSDK.create({ SDKAppID: YOUR_APP_ID });
TUIChatKit.init();
```

## 登入 + 渲染
```ts
await chat.login({ userID: 'user1', userSig: 'YOUR_USERSIG' });
```
