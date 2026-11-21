// ============================================================
// HTML Parser — Regex-based, free-tier VPS compatible
// src/crawlers/html-parser.ts
// ============================================================

export interface ParsedList {
  title: string;
  url: string;
  date?: string;
  summary?: string;
}

/**
 * Extract list items from HTML using regex.
 * Targets government/corporate news list patterns.
 * Zero external deps.
 */
export function extractListItems(html: string, options?: {
  baseUrl?: string;
  maxItems?: number;
  titleMinLength?: number;
}): ParsedList[] {
  const baseUrl = options?.baseUrl || '';
  const maxItems = options?.maxItems || 20;
  const titleMinLength = options?.titleMinLength || 5;
  
  const results: ParsedList[] = [];
  const seenUrls = new Set<string>();
  
  // Pattern: <a href="URL">TEXT</a> — captures link + title
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]{2,200})<\/a>/gi;
  
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null && results.length < maxItems) {
    const [, href, rawTitle] = match;
    const title = decodeHTMLEntities(rawTitle).trim();
    
    if (title.length < titleMinLength || isNavLink(title, href)) continue;
    if (seenUrls.has(href)) continue;
    
    // Resolve relative URLs
    let fullUrl = href;
    if (!href.startsWith('http')) {
      if (href.startsWith('//')) fullUrl = 'https:' + href;
      else if (href.startsWith('/')) {
        const origin = baseUrl ? new URL(baseUrl).origin : '';
        fullUrl = origin + href;
      } else if (baseUrl) {
        fullUrl = baseUrl.replace(/\/$/, '') + '/' + href;
      }
    }
    
    // Skip static assets
    const lower = href.toLowerCase();
    const skipExt = ['.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.ico'];
    if (skipExt.some(ext => lower.endsWith(ext))) continue;
    
    seenUrls.add(href);
    
    // Extract date in surrounding context
    const contextAfter = html.substring(match.index, match.index + 500);
    const date = extractDate(contextAfter);
    
    results.push({
      title: title.substring(0, 200),
      url: fullUrl,
      date,
    });
  }
  
  return results;
}

/**
 * Decode common HTML entities
 */
export function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract date from text — supports ROC calendar, ISO, US formats
 */
export function extractDate(text: string): string | undefined {
  const rocMatch = text.match(/(\d{2,3}\/\d{2}\/\d{2})/);
  if (rocMatch) return rocMatch[1];
  
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  
  const usMatch = text.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})/);
  if (usMatch) return usMatch[1];
  
  return undefined;
}

/**
 * Filter navigation / utility links
 */
function isNavLink(title: string, href: string): boolean {
  const navKeywords = ['首頁', '回上首頁', 'Previous', 'Next', 'Home', 'Back', 'Login', '登出', '下一頁', '上一頁'];
  if (navKeywords.some(k => title.includes(k))) return true;
  if (href.startsWith('#') || href.startsWith('javascript:')) return true;
  if (href.includes('login') || href.includes('logout')) return true;
  return false;
}

/**
 * Extract page meta
 */
export function extractMeta(html: string): { title?: string; description?: string } {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  
  return {
    title: titleMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  };
}
