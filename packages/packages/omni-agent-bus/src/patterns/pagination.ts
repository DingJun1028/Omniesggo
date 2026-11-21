/**
 * Pagination — 分頁工具 (對齊 §12.0 Pagination: 10 項分頁, 控制響應大小)
 *
 * 無作: 空陣列 / 越界頁碼回傳空 items, 不報錯
 * 圓通: 泛型, 可套用任一集合
 * 無礙: total 正確反映全集大小, 不假造
 */
import type { PaginatedResult, PageResult } from './types.js';

export function paginate<T>(items: T[], page: number, size: number): PaginatedResult<T> {
  const safePage = Math.max(1, page | 0 || 1);
  const safeSize = Math.max(1, size | 0 || 10);
  const total = items.length;
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return { page: safePage, size: safeSize, total, items: slice };
}

export function toPageResult<T>(p: PaginatedResult<T>): PageResult<T> {
  return { page: p.page, size: p.size, total: p.total, items: p.items };
}
