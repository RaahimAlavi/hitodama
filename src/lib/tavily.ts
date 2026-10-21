// src/lib/tavily.ts

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
}

export function getSavedTavilyKey(): string {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem('hitodama_tavily_key') || '').trim();
}

/**
 * Live Web Search & Deep Research via Tavily API
 * - 'basic' (1 credit, ~600ms): Fast factual answers for voice queries ("Chat")
 * - 'advanced' (2 credits): In-depth multi-source research for background agents ("Deep / Company / Market Research")
 */
export async function searchTavily(
  query: string,
  options: {
    apiKey?: string;
    depth?: 'basic' | 'advanced';
    maxResults?: number;
    topic?: 'general' | 'news' | 'finance';
  } = {}
): Promise<TavilyResponse | null> {
  const apiKey = (options.apiKey || getSavedTavilyKey()).trim();
  if (!apiKey || !query.trim()) return null;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        search_depth: options.depth || 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: options.maxResults || 5,
        topic: options.topic || 'general',
      }),
    });

    if (!res.ok) {
      console.warn(`[Tavily] Search HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      query: data.query || query,
      answer: data.answer || '',
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch (err) {
    console.warn('[Tavily] Search failed:', err);
    return null;
  }
}

/**
 * Crawl2RAG / URL Content Extractor via Tavily Extract API
 */
export async function extractTavilyUrl(
  urls: string | string[],
  apiKey?: string
): Promise<Array<{ url: string; rawContent: string }>> {
  const key = (apiKey || getSavedTavilyKey()).trim();
  if (!key) return [];

  const urlList = Array.isArray(urls) ? urls : [urls];
  try {
    const res = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: key,
        urls: urlList,
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      url: r.url,
      rawContent: r.raw_content || '',
    }));
  } catch (_) {
    return [];
  }
}
