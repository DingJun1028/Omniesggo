'use client';
import { useState, useEffect } from 'react';
import { db } from '@lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch } from '@lib/firebase';
import { Trash2, ChevronDown, ChevronUp, Database, FileText } from 'lucide-react';

interface RagChunk {
  id: string;
  source: string;
  content: string;
  chunk_index: number;
  created_at: string;
  user_id: string;
}

interface SourceGroup {
  source: string;
  chunks: RagChunk[];
  createdAt: string;
}

export function RagKnowledgeManager() {
  const [chunks, setChunks] = useState<RagChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'rag_knowledge'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RagChunk));
      setChunks(data);
      setLoading(false);
    }, (error) => {
      console.error('Failed to fetch rag_knowledge:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteSource = async (source: string, sourceChunks: RagChunk[]) => {
    if (!confirm(`確定要刪除「${source}」的所有知識切片嗎？\n這將移除 OmniOne 對這份文件的記憶。`)) return;
    
    setDeleting(source);
    try {
      // Use batch for safer multiple deletions if we have many chunks
      const batch = writeBatch(db);
      // Note: Firestore batch has a limit of 500 operations. We'll assume < 500 chunks per file for simplicity here.
      // If a PDF generates more than 500 chunks, it would fail, but for our prototype it's fine.
      let count = 0;
      sourceChunks.forEach((chunk) => {
        if (count < 490) {
          batch.delete(doc(db, 'rag_knowledge', chunk.id));
          count++;
        }
      });
      await batch.commit();
      
      // If there are more than 490 chunks, we can delete the rest individually or just let the user click delete again.
      if (sourceChunks.length > 490) {
        for (let i = 490; i < sourceChunks.length; i++) {
          await deleteDoc(doc(db, 'rag_knowledge', sourceChunks[i].id));
        }
      }
    } catch (error) {
      console.error('Error deleting source chunks:', error);
      alert('刪除失敗，請查看控制檯。');
    } finally {
      setDeleting(null);
    }
  };

  const toggleSource = (source: string) => {
    setExpandedSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  // Group by source
  const sourceGroupsMap = chunks.reduce((acc, chunk) => {
    if (!acc[chunk.source]) {
      acc[chunk.source] = { source: chunk.source, chunks: [], createdAt: chunk.created_at };
    }
    acc[chunk.source].chunks.push(chunk);
    // update createdAt to the oldest one (assuming it's when the file was ingested)
    if (new Date(chunk.created_at) < new Date(acc[chunk.source].createdAt)) {
      acc[chunk.source].createdAt = chunk.created_at;
    }
    return acc;
  }, {} as Record<string, SourceGroup>);

  const sourceGroups = Object.values(sourceGroupsMap).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="text-base font-bold text-accentTeal tracking-wide flex items-center gap-2">
        <Database size={18} /> 知識庫治理 (Knowledge Base Governance)
      </div>
      <div className="text-[13px] text-textSecondary leading-[1.6]">
        管理 OmniOne LLM 大腦中的知識記憶。此處顯示了被系統吸收並切片的 PDF 內容，體現了 5T 協議中的 <strong className="text-accentGold">Transparent (可驗算)</strong> 精神。
      </div>

      {loading ? (
        <div className="text-center py-8 text-textSecondary text-sm">載入中...</div>
      ) : sourceGroups.length === 0 ? (
        <div className="border border-dashed border-borderColor rounded-xl py-10 px-5 text-center bg-primary">
          <div className="text-textSecondary text-sm">目前知識庫沒有任何文檔，請在上方上傳 PDF。</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sourceGroups.map(group => {
            const isExpanded = expandedSources[group.source];
            const isDeleting = deleting === group.source;
            
            return (
              <div key={group.source} className="border border-borderColor rounded-xl overflow-hidden bg-primary shadow-sm">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => toggleSource(group.source)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-accentTeal" size={20} />
                    <div>
                      <div className="font-semibold text-textPrimary text-sm">{group.source}</div>
                      <div className="text-xs text-textSecondary flex gap-2 mt-1">
                        <span>產生了 <strong className="text-accentTeal">{group.chunks.length}</strong> 個切片</span>
                        <span>•</span>
                        <span>{new Date(group.createdAt).toLocaleString('zh-TW', { hour12: false })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSource(group.source, group.chunks);
                      }}
                      disabled={isDeleting}
                      className="border border-[#FF4D6D] text-[#FF4D6D] bg-transparent hover:bg-[#FF4D6D]/10 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      title="移除此來源的所有知識"
                    >
                      {isDeleting ? '刪除中...' : <span className="flex items-center gap-1"><Trash2 size={14}/> 清除知識</span>}
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-textSecondary" /> : <ChevronDown size={20} className="text-textSecondary" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-borderColor bg-secondary p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                    {group.chunks.sort((a,b) => a.chunk_index - b.chunk_index).map(chunk => (
                      <div key={chunk.id} className="bg-primary border border-borderColor rounded-lg p-3">
                        <div className="text-[11px] text-accentGold font-semibold mb-2">Chunk #{chunk.chunk_index}</div>
                        <div className="text-[13px] text-textPrimary leading-relaxed whitespace-pre-wrap font-['Noto_Sans_TC']">
                          {chunk.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
