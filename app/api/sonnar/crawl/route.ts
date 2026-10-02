import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // 100% 免費的本地端爬蟲 (不依賴 ZenRows 等付費 API)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SonnarIntelligence/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      // 加入 timeout 防止卡死
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 移除不必要的標籤以減少雜訊
    $('script, style, noscript, iframe, img, svg, video').remove();

    // 萃取純文字內容
    const title = $('title').text().trim();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // 截斷過長的內容，以適應 Ollama Context Window (3b-64k 支援長文本，但我們保守取前 15000 字元)
    const truncatedText = bodyText.substring(0, 15000);

    return NextResponse.json({
      success: true,
      data: {
        url,
        title,
        content: truncatedText,
        scrapedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      fallback: {
        url: 'Local Testing Fallback',
        title: '無法抓取外部網站，啟用本地備援資料',
        content: '這是本地備援測試資料：該企業宣稱在 2025 年達成碳中和，但未揭露範圍三排放數據，可能存在漂綠風險。',
        scrapedAt: new Date().toISOString()
      }
    });
  }
}
