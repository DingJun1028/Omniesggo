# Tencent RTC TUIKit — React 18 集成

## 安裝
```bash
npm install @tencentcloud/chat @tencentcloud/chat-uikit-react
```

## 初始化
```tsx
import { ChatSDK } from '@tencentcloud/chat';
import { TUIChatKit } from '@tencentcloud/chat-uikit-react';

const chat = ChatSDK.create({ SDKAppID: YOUR_APP_ID });
TUIChatKit.init();
```

## 登入
```tsx
await chat.login({ userID: 'user1', userSig: 'YOUR_USERSIG' });
```

## 渲染單聊
```tsx
import { TUIConversationService, TUIChatService } from '@tencentcloud/chat-uikit-react';
<TUIChatService />
```
