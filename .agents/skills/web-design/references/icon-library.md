# Lucide-React 圖示分類速查表

artifact 環境內建 lucide-react@0.383.0，可直接 `import { IconName } from "lucide-react"` 使用。
所有圖示為24x24 SVG，支持 `size`、`color`、`strokeWidth` 屬性。

## 導航類
| 用途 | 圖示名 | 匯入 |
|------|--------|------|
| 選單 | Menu, AlignJustify | `import { Menu } from "lucide-react"` |
| 關閉 | X, XCircle | `import { X } from "lucide-react"` |
| 返回 | ArrowLeft, ChevronLeft | `import { ArrowLeft } from "lucide-react"` |
| 前進 | ArrowRight, ChevronRight | `import { ArrowRight } from "lucide-react"` |
| 上方 | ArrowUp, ChevronUp | `import { ArrowUp } from "lucide-react"` |
| 下方 | ArrowDown, ChevronDown | `import { ArrowDown } from "lucide-react"` |
| 首頁 | Home | `import { Home } from "lucide-react"` |
| 外鏈 | ExternalLink, ArrowUpRight | `import { ExternalLink } from "lucide-react"` |
| 搜索 | Search | `import { Search } from "lucide-react"` |

## 社交媒體
| 用途 | 圖示名 | 匯入 |
|------|--------|------|
| GitHub | Github | `import { Github } from "lucide-react"` |
| Twitter/X | Twitter | `import { Twitter } from "lucide-react"` |
| LinkedIn | Linkedin | `import { Linkedin } from "lucide-react"` |
| YouTube | Youtube | `import { Youtube } from "lucide-react"` |
| Instagram | Instagram | `import { Instagram } from "lucide-react"` |
| 郵件 | Mail, MailOpen | `import { Mail } from "lucide-react"` |
| 連結 | Link, Link2 | `import { Link } from "lucide-react"` |
| 分享 | Share2 | `import { Share2 } from "lucide-react"` |

## 內容/文件
| 用途 | 圖示名 |
|------|--------|
| 文件 | File, FileText, FilePlus |
| 資料夾 | Folder, FolderOpen |
| 圖片 | Image, ImagePlus |
| 影片 | Video, Play, Pause |
| 音訊 | Music, Volume2 |
| 下載 | Download |
| 上傳 | Upload |
| 複製 | Copy, Clipboard |
| 編輯 | Pencil, PenLine, Edit |
| 刪除 | Trash2 |

## 使用者/個人
| 用途 | 圖示名 |
|------|--------|
| 使用者 | User, UserCircle |
| 使用者組 | Users |
| 頭像 | CircleUser |
| 位置 | MapPin |
| 電話 | Phone |
| 日曆 | Calendar |
| 時鐘 | Clock |
| 生日 | Cake |

## 技能/技術
| 用途 | 圖示名 |
|------|--------|
| 程式碼 | Code, Code2, Terminal |
| 資料庫 | Database |
| 伺服器 | Server |
| 云端 | Cloud |
| 設定 | Settings, Cog |
| 工具 | Wrench, Hammer |
| 圖層 | Layers |
| 元件 | Component, Puzzle |
| CPU | Cpu |
| 閃電/快速 | Zap |
| 框架 | LayoutGrid, Grid3x3 |
| API | Webhook |
| 安全 | Shield, Lock |

## 狀態/反饋
| 用途 | 圖示名 |
|------|--------|
| 成功 | Check, CheckCircle |
| 警告 | AlertTriangle |
| 錯誤 | AlertCircle, XCircle |
| 信息 | Info |
| 載入 | Loader2 (可加animate-spin) |
| 星標 | Star, StarHalf |
| 心形 | Heart |
| 點贊 | ThumbsUp |

## 裝飾/佈局
| 用途 | 圖示名 |
|------|--------|
| 太陽(亮色模式) | Sun |
| 月亮(暗色模式) | Moon |
| 引號 | Quote |
| 火焰 | Flame |
| 火箭 | Rocket |
| 獎盃 | Trophy |
| 目標 | Target |
| 燈泡 | Lightbulb |
| 書本 | BookOpen |
| 畢業帽 | GraduationCap |
| 公文包 | Briefcase |
| 建筑 | Building |

## 使用示例

```jsx
import { Github, Mail, ArrowUpRight, Moon, Sun } from "lucide-react";

// 基本用法
<Github size={20} />

// 自定義顏色和描邊
<Mail size={24} color="var(--color-primary)" strokeWidth={1.5} />

// 配合按鈕
<button className="flex items-center gap-2">
  <ArrowUpRight size={16} />
  View Project
</button>

// 主題切換圖示
{isDark ? <Sun size={20} /> : <Moon size={20} />}
```

## 注意事項

1. 始終從 lucide-react 匯入，不要用 `<svg>` 手寫或 Emoji 替代
2. 社交圖示如果 lucide 沒有（如微信、微博），使用 SVG 內聯：在 `references/` 目錄下無預置，需程式碼中手寫簡化SVG path
3. `size` 屬性接受 number（px），常用值：16（小按鈕內）、20（普通）、24（標準）、32（大圖示）、48（裝飾）
4. `strokeWidth` 預設 2，細線設 1.5，粗線設 2.5
5. `className` 可傳入 Tailwind 類，如 `className="animate-spin"` 做旋轉載入
