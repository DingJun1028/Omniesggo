// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  version: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  relatedIds: string[];
}

export interface WikiSearchResult {
  article: WikiArticle;
  score: number;
  highlights: string[];
}

export class OmniWiki {
  private articles: Map<string, WikiArticle> = new Map();
  private slugIndex: Map<string, string> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  create(article: Omit<WikiArticle, 'id' | 'createdAt' | 'updatedAt'>): WikiArticle {
    const now = Date.now();
    const id = `wiki-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const full: WikiArticle = {
      ...article,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(id, Object.freeze(full));
    this.slugIndex.set(article.slug, id);
    for (const tag of article.tags) {
      const set = this.tagIndex.get(tag) || new Set();
      set.add(id);
      this.tagIndex.set(tag, set);
    }
    return full;
  }

  get(id: string): WikiArticle | undefined {
    return this.articles.get(id);
  }

  getBySlug(slug: string): WikiArticle | undefined {
    const id = this.slugIndex.get(slug);
    return id ? this.articles.get(id) : undefined;
  }

  search(query: string): WikiSearchResult[] {
    const q = query.toLowerCase();
    const results: WikiSearchResult[] = [];
    for (const article of this.articles.values()) {
      const titleMatch = article.title.toLowerCase().includes(q);
      const contentMatch = article.content.toLowerCase().includes(q);
      const tagMatch = article.tags.some(t => t.toLowerCase().includes(q));
      if (!titleMatch && !contentMatch && !tagMatch) continue;
      const score = (titleMatch ? 3 : 0) + (contentMatch ? 1 : 0) + (tagMatch ? 2 : 0);
      const highlights: string[] = [];
      if (titleMatch) highlights.push(article.title);
      if (contentMatch) {
        const idx = article.content.toLowerCase().indexOf(q);
        if (idx >= 0) highlights.push(article.content.slice(idx, idx + 120));
      }
      results.push({ article, score, highlights });
    }
    return results.sort((a, b) => b.score - a.score);
  }

  getByTag(tag: string): WikiArticle[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this.articles.get(id)!).filter(Boolean);
  }

  list(): WikiArticle[] {
    return Array.from(this.articles.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  count(): number {
    return this.articles.size;
  }
}

export const omniWiki = new OmniWiki();
