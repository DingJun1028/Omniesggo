/**
 * 5T Transparent — render contract for the v5 sustain report.
 *
 * These tests exist because the client (app/sustain-write/page.tsx) offers
 * "圖表" / "智慧配圖" toggles. A toggle that reaches the API but is never consumed
 * by the renderer is a control that lies, so each toggle is pinned here:
 *
 *   charts:true  -> report embeds a data-derived SVG (<svg data-viz=...>)
 *   charts:false -> no data-viz block at all
 *   imagery:true -> per-chapter figure marker (<figure data-figure=...>)
 *   imagery:false-> no data-figure markers
 *
 * The chapter-count stat must come from report.chapters.length, never a literal.
 */
import { describe, it, expect } from 'vitest';
import {
  reportV5ToHtml,
  reportV5ToMarkdown,
  renderOptionsFromQuery,
} from '@/core/services/report-generator-v5';
import {
  createTask,
  normalizeRenderOptions,
  getTask,
  DEFAULT_RENDER_OPTIONS,
} from '@/core/services/async-task-manager';
import type { V5GeneratedReport, V5ReportChapter } from '@/core/services/report-assembly-v5';

function chapter(over: Partial<V5ReportChapter>): V5ReportChapter {
  return {
    id: `ch-${over.num ?? 1}`,
    num: over.num ?? 1,
    title: over.title ?? '章節',
    griCodes: ['GRI-1'],
    fiveTGate: 'pass',
    content: over.content ?? '<p>內容</p>',
    wordCount: over.wordCount ?? 1000,
    zkpHash: '0xdeadbeef',
    omniTagUuid: 'uuid-1',
    evidenceCount: over.evidenceCount ?? 3,
  };
}

/** Deliberately NOT 28 chapters — a hardcoded 28 in the renderer must fail here. */
function fixture(): V5GeneratedReport {
  const chapters = [
    chapter({ num: 1, title: '組織概述', wordCount: 1200, evidenceCount: 5 }),
    chapter({ num: 2, title: '永續績效', wordCount: 800, evidenceCount: 2 }),
  ];
  return {
    companyId: 'inst-test',
    companyName: '測試股份有限公司',
    industry: '測試業',
    chapters,
    totalWords: 2000,
    totalParagraphs: 8,
    totalOmniTags: 2,
    totalEvidence: 7,
    fiveTStatus: { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true },
    trinityHash: '0xfeedface',
    generatedAt: '2026-10-02T00:00:00.000Z',
    reportVersion: '5.0',
  };
}

describe('sustain-write v5 render — renderOptions is honored', () => {
  it('embeds a data-derived SVG chart when charts:true', () => {
    const html = reportV5ToHtml(fixture(), { charts: true, imagery: true });
    expect(html).toContain('data-viz="chapter-wordcount"');
    expect(html).toContain('<svg');
    // bars are scaled from the real per-chapter wordCount values (1200 / 800)
    expect(html).toContain('data-chapter="1"');
    expect(html).toContain('data-chapter="2"');
  });

  it('omits the chart block entirely when charts:false', () => {
    const html = reportV5ToHtml(fixture(), { charts: false, imagery: true });
    expect(html).not.toContain('data-viz=');
    expect(html).not.toContain('<svg');
  });

  it('emits a figure marker per chapter when imagery:true', () => {
    const html = reportV5ToHtml(fixture(), { charts: false, imagery: true });
    expect(html).toContain('data-figure="ch-1"');
    expect(html).toContain('data-figure="ch-2"');
  });

  it('omits figure markers when imagery:false', () => {
    const html = reportV5ToHtml(fixture(), { charts: false, imagery: false });
    expect(html).not.toContain('data-figure=');
  });

  it('defaults to charts+imagery when no options are passed (back-compat)', () => {
    const html = reportV5ToHtml(fixture());
    expect(html).toContain('data-viz="chapter-wordcount"');
    expect(html).toContain('data-figure="ch-1"');
  });
});

describe('sustain-write v5 render — no hardcoded chapter count', () => {
  it('reports the real chapter count from the report, not a literal 28', () => {
    const html = reportV5ToHtml(fixture(), { charts: false, imagery: false });
    expect(html).toContain('data-stat="chapters"');
    expect(html).toMatch(/data-stat="chapters"[^>]*data-value="2"/);
  });

  it('markdown renderer also accepts render options without throwing', () => {
    const md = reportV5ToMarkdown(fixture(), { charts: true, imagery: false });
    expect(md).toContain('測試股份有限公司');
  });
});

describe('renderOptions normalization (5T Transparent defaults)', () => {
  it('returns both-true for undefined / non-object input', () => {
    expect(normalizeRenderOptions(undefined)).toEqual(DEFAULT_RENDER_OPTIONS);
    expect(normalizeRenderOptions(null)).toEqual(DEFAULT_RENDER_OPTIONS);
    expect(normalizeRenderOptions('nope')).toEqual(DEFAULT_RENDER_OPTIONS);
  });

  it('honours an explicit false (an omitted field must NOT mean false)', () => {
    expect(normalizeRenderOptions({ charts: false })).toEqual({ charts: false, imagery: true });
    expect(normalizeRenderOptions({ imagery: false })).toEqual({ charts: true, imagery: false });
    expect(normalizeRenderOptions({ charts: false, imagery: false })).toEqual({
      charts: false,
      imagery: false,
    });
  });
});

describe('renderOptionsFromQuery (GET preview/download contract)', () => {
  const q = (s: string) => new URLSearchParams(s);

  it('treats an absent param as "on" (back-compat for old links)', () => {
    expect(renderOptionsFromQuery(q(''))).toEqual({ charts: true, imagery: true });
  });

  it('honours explicit 0 / false as off', () => {
    expect(renderOptionsFromQuery(q('charts=0&imagery=false'))).toEqual({
      charts: false,
      imagery: false,
    });
  });

  it('honours explicit 1 / true as on', () => {
    expect(renderOptionsFromQuery(q('charts=1&imagery=true'))).toEqual({
      charts: true,
      imagery: true,
    });
  });

  it('does not let a malformed value silently disable a feature', () => {
    expect(renderOptionsFromQuery(q('charts=&imagery=maybe'))).toEqual({
      charts: true,
      imagery: true,
    });
  });

  it('ignores unrelated params', () => {
    expect(renderOptionsFromQuery(q('companyId=acme&format=html&charts=0'))).toEqual({
      charts: false,
      imagery: true,
    });
  });

  it('drives the real renderer end to end from a query string', () => {
    const report = fixture();
    const off = reportV5ToHtml(report, renderOptionsFromQuery(q('charts=0&imagery=0')));
    expect(off).not.toContain('data-viz=');
    expect(off).not.toContain('data-figure=');

    const on = reportV5ToHtml(report, renderOptionsFromQuery(q('charts=1&imagery=1')));
    expect(on).toContain('data-viz=');
    expect(on).toContain('data-figure=');
  });
});

describe('createTask carries renderOptions onto the task (no silent drop)', () => {
  it('stores the requested options', async () => {
    const taskId = createTask('inst-test', 'tcfd', undefined, undefined, {
      charts: false,
      imagery: true,
    });
    const task = await getTask(taskId);
    expect(task).not.toBeNull();
    expect(task?.renderOptions).toEqual({ charts: false, imagery: true });
  });

  it('defaults to both-true when the client omits options', async () => {
    const taskId = createTask('inst-test', 'gri');
    const task = await getTask(taskId);
    expect(task?.renderOptions).toEqual(DEFAULT_RENDER_OPTIONS);
  });

  it('derives totalChapters from the template (gri=28, tcfd=12, investor=5)', async () => {
    expect((await getTask(createTask('inst-test', 'gri')))?.totalChapters).toBe(28);
    expect((await getTask(createTask('inst-test', 'tcfd')))?.totalChapters).toBe(12);
    expect((await getTask(createTask('inst-test', 'investor')))?.totalChapters).toBe(5);
  });
});
