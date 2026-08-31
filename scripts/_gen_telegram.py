content = '''Log in here to **manage your apps** using Telegram API or **delete your account**.
來源網址: https://my.telegram.org/apps

## 應用程式配置
- **應用 api_id：** 33158634
- **應用 api_hash：** 56b82b0373dc3138935cd48a15a66ddf
- **應用程式名稱：** （未填）
- **簡稱：** 字母數字混合，5-32 個字符

### FCM憑證 [更新](https://my.telegram.org/apps/fcm_service_account)

### 可用的 MTProto 伺服器
**測試配置：** 149.154.167.40:443 (DC 2)
公鑰：
```
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAyMEdY1aR+sCR3ZSJrtztKTKqigvO/vBfqACJLZtS7QMgCGXJ6XIR
yy7mx66W0/sOFa7/1mAZtEoIokDP3ShoqF4fVNb6XeqgQfaUHd8wJpDWHcR2OFwv
plUUI1PLTktZ9uW2WE23b+ixNwJjJGwBDJPQEQFBE+vfmH0JP503wr5INS1poWg/
j25sIWeYPHYeOrFp/eXaqhISP6G+q2IeTaWTXpwZj4LzXq5YOpk4bYEQ6mvRq7D1
aHWfYmlEGepfaYR8Q0YqvvhYtMte3ITnuSJs171+GDqpdKcSwHnd6FudwGO4pcCO
j4WcDuXc2CTHgH8gFTNhp/Y8/SpDOhvn9QIDAQAB
-----END RSA PUBLIC KEY-----
```

**生產配置：** 149.154.167.50:443 (DC 2)
公鑰：
```
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA6LszBcC1LGzyr992NzE0ieY+BSaOW622Aa9Bd4ZHLl+TuFQ4lo4g
5nKaMBwK/BIb9xUfg0Q29/2mgIR6Zr9krM7HjuIcCzFvDtr+L0GQjae9H0pRB2OO
62cECs5HKhT5DZ98K33vmWiLowc621dQuwKWSQKjWf50XYFw42h21P2KXUGyp2y/
+aEyZ+uVgLLQbRA1dEjSDZ2iGRy12Mk5gpYc397aYp438fsJoHIgJ2lgMv5h7WY9
t6N/byY9Nw9p21Og3AoXSL2q/2IJ1WRUhebgAdGVMlV1fkuOQoEzR7EdpqtQD9Cs
5+bfo3Nhmcyvk5ftB0WkJ9z6bNZ7yxrP8wIDAQAB
-----END RSA PUBLIC KEY-----
```
'''

md = f"""---
title: 應用程式配置
source: Notion
notion_id: 3b3ccd20-97d7-8108-aab6-cc8e730e5c28
tags: [Telegram, API配置, MTProto]
---

# 應用程式配置

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/應用程式配置.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
