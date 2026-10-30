import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const options = await request.json();
    const { format, layers, includeTags, includeMetadata } = options;

    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1000));

    const memories = [
      {
        id: '1',
        content: 'ESG 報告書需遵循 GRI 2024 標準，重點關注雙重重大性分析',
        layer: 'L2',
        tags: includeTags ? ['ESG', 'GRI', '重大性'] : undefined,
        timestamp: includeMetadata ? Date.now() - 3600000 : undefined,
        source: includeMetadata ? 'omni-agent' : undefined,
      },
      {
        id: '2',
        content: '5T 協議：Traceable、Transparent、Trustworthy、Transferful、True',
        layer: 'L3',
        tags: includeTags ? ['5T', '協議', '信任'] : undefined,
        timestamp: includeMetadata ? Date.now() - 7200000 : undefined,
        source: includeMetadata ? 'core' : undefined,
      },
    ].filter(m => layers.includes(m.layer));

    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify({ exportedAt: new Date().toISOString(), count: memories.length, memories }, null, 2);
      contentType = 'application/json';
      filename = `omni-memory-export-${Date.now()}.json`;
    } else if (format === 'csv') {
      const headers = 'id,layer,content' + (includeTags ? ',tags' : '') + (includeMetadata ? ',timestamp,source' : '') + '\n';
      const rows = memories.map(m => {
        const content = `"${m.content.replace(/"/g, '""')}"`;
        const tags = includeTags ? `"${(m.tags || []).join(';')}"` : '';
        const meta = includeMetadata ? `,${m.timestamp},${m.source}` : '';
        return `${m.id},${m.layer},${content}${includeTags ? ',' + tags : ''}${meta}`;
      }).join('\n');
      content = headers + rows;
      contentType = 'text/csv';
      filename = `omni-memory-export-${Date.now()}.csv`;
    } else if (format === 'markdown') {
      let md = `# OmniMemory Export\n\nExported: ${new Date().toISOString()}\nCount: ${memories.length}\n\n`;
      memories.forEach(m => {
        md += `## ${m.id} [${m.layer}]\n\n${m.content}\n\n`;
        if (includeTags && m.tags) md += `**Tags:** ${m.tags.join(', ')}\n\n`;
        if (includeMetadata) md += `*Source: ${m.source} | Time: ${new Date(m.timestamp).toISOString()}*\n\n`;
        md += '---\n\n';
      });
      content = md;
      contentType = 'text/markdown';
      filename = `omni-memory-export-${Date.now()}.md`;
    } else {
      content = JSON.stringify({ format: 'zip', memories }, null, 2);
      contentType = 'application/zip';
      filename = `omni-memory-export-${Date.now()}.zip`;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
