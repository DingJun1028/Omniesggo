import { useState } from 'react'
import { tags, documents, pillarMeta } from '../data/seed.js'
import { SectionHeader, TagChip, EmptyState } from '../components/ui.jsx'

export default function Knowledge() {
  const [activeTag, setActiveTag] = useState(null)
  const [query, setQuery] = useState('')

  const filteredDocs = documents.filter((d) => {
    const matchTag = !activeTag || d.tags.includes(activeTag)
    const matchQuery = !query || d.title.toLowerCase().includes(query.toLowerCase())
    return matchTag && matchQuery
  })

  return (
    <div className="view">
      <div className="view-hero">
        <div>
          <div className="eyebrow">支柱四 · 知識庫</div>
          <h1 className="view-title">知識庫</h1>
          <p className="view-sub">
            智慧標籤引擎自動沉澱永續知識，雙向追蹤「資料 → 標籤 → 資料」的血緣。
          </p>
        </div>
      </div>

      <section className="panel">
        <SectionHeader eyebrow="標籤雲" title="熱門標籤" />
        <div className="tag-cloud">
          {tags.map((t) => (
            <TagChip
              key={t.id}
              name={`${t.name} · ${t.count}`}
              active={activeTag === t.name}
              onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="文件檢索"
          title="永續文件"
          action={
            <input
              className="search-input"
              placeholder="搜尋文件…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          }
        />
        {filteredDocs.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="沒有符合的文件"
            desc="試著調整搜尋關鍵字或清除標籤篩選。"
          />
        ) : (
          <ul className="doc-list">
            {filteredDocs.map((d) => (
              <li key={d.id} className="doc-item">
                <div className="doc-icon">📄</div>
                <div className="doc-body">
                  <p className="doc-title">{d.title}</p>
                  <div className="doc-tags">
                    {d.tags.map((t) => (
                      <span key={t} className="doc-tag">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="doc-meta">
                  <span>{d.size}</span>
                  <span>{d.updated}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
