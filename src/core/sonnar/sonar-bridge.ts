/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// Sonar Bridge — Connects crawler output to subscription engine
// src/core/sonnar/sonar-bridge.ts
// ============================================================

import type { CrawlResultItem } from '../../crawlers/base-crawler';
import type { CrawlResult } from '../../crawlers/base-crawler';
import type { ChangeEvent } from '../../lib/engines/subscription-engine';
import { subscriptionEngine } from '../../lib/engines/subscription-engine';
import { generateHash } from './hash-lock';

export interface BridgeResult {
  crawlSourceId: string;
  itemsProcessed: number;
  eventsGenerated: number;
  matches: SubscriptionMatch[];
  errors: string[];
}

export interface SubscriptionMatch {
  subscriberId: string;
  subscriberName: string;
  subscriptionTarget: string;
  eventTitle: string;
  relevanceScore: number;
  severity: string;
}

/**
 * Convert crawled items into ChangeEvents for the subscription engine
 */
export function convertToChangeEvent(
  crawlResult: CrawlResult,
  item: CrawlResultItem
): ChangeEvent {
  // Determine event type from content analysis
  const eventType = classifyEventType(item.title);
  
  // Extract related companies/topics from title
  const relatedCompanies = extractCompanies(item.title);
  const relatedTopics = extractTopics(item.title);
  const relatedRegions = extractRegions(item.title);
  
  // Determine severity based on keywords
  const severity = assessSeverity(item.title);

  return {
    id: `evt_${item.hash}`,
    sourceId: crawlResult.sourceId,
    sourceName: getDisplayName(crawlResult.sourceId),
    eventType,
    title: item.title,
    summary: item.summary || `${getDisplayName(crawlResult.sourceId)} 新公告`,
    url: item.url,
    relatedTopics,
    relatedCompanies,
    relatedRegions,
    severity,
    detectedAt: new Date().toISOString(),
    snapshot: item.hash,
  };
}

/**
 * Process a full crawl result through the subscription engine
 */
export function processCrawlResult(crawlResult: CrawlResult): BridgeResult {
  const bridgeResult: BridgeResult = {
    crawlSourceId: crawlResult.sourceId,
    itemsProcessed: crawlResult.items.length,
    eventsGenerated: 0,
    matches: [],
    errors: [],
  };

  for (const item of crawlResult.items) {
    try {
      const event = convertToChangeEvent(crawlResult, item);
      bridgeResult.eventsGenerated++;
      
      // Match against all subscribers
      const matchResults = subscriptionEngine.matchEvent(event);
      
      for (const match of matchResults) {
        bridgeResult.matches.push({
          subscriberId: match.subscriber.id,
          subscriberName: match.subscriber.name,
          subscriptionTarget: match.subscription.target,
          eventTitle: event.title,
          relevanceScore: match.relevanceScore,
          severity: event.severity,
        });
      }
    } catch (err) {
      bridgeResult.errors.push(`Item ${item.hash}: ${err}`);
    }
  }

  return bridgeResult;
}

/**
 * Classify event type from title keywords
 */
function classifyEventType(title: string): string {
  const lower = title.toLowerCase();
  
  if (lower.includes('罰') || lower.includes('裁處') || lower.includes('penalty') || lower.includes('fine')) {
    return 'penalty';
  }
  if (lower.includes('訴訟') || lower.includes('litigation') || lower.includes('lawsuit')) {
    return 'litigation';
  }
  if (lower.includes('政策') || lower.includes('修正') || lower.includes('修正草案') || lower.includes('policy_update')) {
    return 'policy_update';
  }
  if (lower.includes('財報') || lower.includes('年報') || lower.includes('esg report') || lower.includes('永續報告')) {
    return 'filing';
  }
  if (lower.includes('價格') || lower.includes('碳價') || lower.includes('price') || lower.includes('cbam')) {
    return 'price_change';
  }
  if (lower.includes('稽覈') || lower.includes('audit') || lower.includes('inspection')) {
    return 'audit';
  }
  if (lower.includes('制裁') || lower.includes('sanction') || lower.includes('ofac')) {
    return 'sanction';
  }
  if (lower.includes('標準') || lower.includes('準則') || lower.includes('standard') || lower.includes('framework')) {
    return 'standard_update';
  }
  
  return 'new_content';
}

/**
 * Extract company names from title (common TW patterns)
 */
function extractCompanies(title: string): string[] {
  const companies: string[] = [];
  
  // Pattern: "公司" or "股份有限公司" preceded by Chinese name
  const companyPattern = /([\u4e00-\u9fff]{2,15}(?:公司|股份有限公司|股份有限公司))/g;
  let match: RegExpExecArray | null;
  while ((match = companyPattern.exec(title)) !== null) {
    companies.push(match[1]);
  }
  
  // Also check for well-known abbreviations
  const knownCompanies = ['臺積電', '鴻海', '聯發科', '臺達電', '富邦媒', '中信金', '羣光', '漢唐'];
  for (const c of knownCompanies) {
    if (title.includes(c) && !companies.includes(c)) {
      companies.push(c);
    }
  }
  
  return companies;
}

/**
 * Extract ESG topics from title
 */
function extractTopics(title: string): string[] {
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    '碳排放': ['碳', '碳排放', '溫室氣體', 'GHG', 'carbon', 'emission'],
    '氣候': ['氣候', 'TCFD', '氣候變遷', '淨零', 'net zero'],
    '人權': ['人權', 'human rights', '勞動', '工時'],
    '治理': ['董事會', '治理', 'ESG', '稽覈', '吹哨'],
    '水資源': ['水', '水資源', '水污染'],
    '廢棄物': ['廢棄物', '垃圾', '回收', '循環經濟'],
    '能源': ['能源', '再生能源', '太陽能', '風電'],
    '供應鏈': ['供應鏈', '供應商', '價值鏈'],
    '永續報告': ['永續報告', 'ESG report', 'GRI', 'IFRS'],
    '碳費': ['碳費', '碳稅', 'CBAM', '碳定價'],
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => title.includes(kw))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

/**
 * Extract region info from title
 */
function extractRegions(title: string): string[] {
  const regions: string[] = [];
  const regionMap: Record<string, string[]> = {
    '臺灣': ['臺灣', '臺灣', 'TW', '金管會', '證交所'],
    '中國': ['中國', '大陸', 'CN', '北京'],
    '美國': ['美國', 'US', 'SEC', 'EPA', 'OFAC'],
    '歐盟': ['歐盟', 'EU', 'CSRD', 'ESRS', 'EFRAG'],
    '日本': ['日本', 'JP', 'FSA'],
    '香港': ['香港', 'HK', 'HKEX'],
  };
  
  for (const [region, keywords] of Object.entries(regionMap)) {
    if (keywords.some(kw => title.includes(kw))) {
      regions.push(region);
    }
  }
  
  return regions.length > 0 ? regions : ['臺灣'];
}

/**
 * Assess severity from title keywords
 */
function assessSeverity(title: string): 'low' | 'medium' | 'high' | 'critical' {
  const lower = title.toLowerCase();
  
  if (lower.includes('緊急') || lower.includes('critical') || lower.includes('立即') || 
      lower.includes('重大') || lower.includes('urgent')) {
    return 'critical';
  }
  if (lower.includes('修正') || lower.includes('草案') || lower.includes('proposal') ||
      lower.includes('罰') || lower.includes('penalty')) {
    return 'high';
  }
  if (lower.includes('公告') || lower.includes('notice') || lower.includes('update')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get display name for source ID
 */
function getDisplayName(sourceId: string): string {
  const nameMap: Record<string, string> = {
    'tw-fsc': '金管會',
    'tw-moenv': '環境部',
    'tw-twse': '證交所',
    'tw-mof': '財政部',
    'tw-moea': '經濟部',
    'tw-tpex': '櫃買中心',
    'eu-csrd': 'EU CSRD',
    'eu-esrs': 'EU ESRS',
    'us-sec': 'SEC',
    'us-epa': 'EPA',
    'int-ifrs': 'IFRS/ISSB',
    'int-gri': 'GRI',
    'int-tcfd': 'TCFD',
    'int-cdp': 'CDP',
    'jp-fsa': 'Japan FSA',
    'hk-ex': 'HKEX',
  };
  return nameMap[sourceId] || sourceId;
}
