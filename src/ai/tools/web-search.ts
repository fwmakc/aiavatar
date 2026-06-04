export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  search(query: string, lang?: string): Promise<SearchResult[]>;
}

const MAX_RESULTS = 3;

class SerperProvider implements SearchProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, lang?: string): Promise<SearchResult[]> {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          gl: lang === 'ru' ? 'ru' : undefined,
          hl: lang === 'ru' ? 'ru' : undefined,
          num: MAX_RESULTS,
        }),
      });

      if (!res.ok) throw new Error(`Serper ${res.status}`);

      const data = await res.json() as { organic?: Array<{ title?: string; link?: string; snippet?: string }> };
      return (data.organic || []).slice(0, MAX_RESULTS).map(item => ({
        title: item.title || '',
        url: item.link || '',
        snippet: item.snippet || '',
      }));
    } catch (e) {
      console.error('[WebSearch:Serper] Error:', e);
      return [];
    }
  }
}

class BraveProvider implements SearchProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({ q: query, count: String(MAX_RESULTS) });
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: {
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Brave ${res.status}`);

      const data = await res.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
      return (data.web?.results || []).slice(0, MAX_RESULTS).map(item => ({
        title: item.title || '',
        url: item.url || '',
        snippet: item.description || '',
      }));
    } catch (e) {
      console.error('[WebSearch:Brave] Error:', e);
      return [];
    }
  }
}

export function createSearchProvider(
  provider: 'serper' | 'brave',
  apiKey: string
): SearchProvider {
  if (provider === 'brave') return new BraveProvider(apiKey);
  return new SerperProvider(apiKey);
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const lines = results.map((r, i) =>
    `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`
  );

  return `Web search results for fact-checking:\n${lines.join('\n')}\n\nUse these results if relevant. Cite sources naturally in your response.`;
}
