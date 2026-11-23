export const API_BASE = 'https://api.github.com';
export const API_VERSION = '2026-03-10';

export class GithubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseHeaders: Headers | null = null,
  ) {
    super(message);
    this.name = 'GithubError';
  }
}
export class AuthError extends GithubError {
  constructor(message = 'Your GitHub token was rejected. Check it in Settings.') {
    super(message, 401);
    this.name = 'AuthError';
  }
}
export class RateLimitError extends GithubError {
  constructor(readonly resetAt: number, message = 'GitHub API rate limit reached.') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}
export class NotFoundError extends GithubError {
  constructor(message = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export interface GithubRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  raw?: boolean;
}

export class GithubClient {
  readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request<T>(path: string, options: GithubRequestOptions = {}): Promise<T> {
    const { raw, headers, ...rest } = options;
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': API_VERSION,
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? '5000');
    if ((response.status === 403 || response.status === 429) && remaining <= 0) {
      const reset = Number(response.headers.get('x-ratelimit-reset') ?? String(Math.floor(Date.now() / 1000) + 3600));
      throw new RateLimitError(reset * 1000);
    }
    if (response.status === 401) throw new AuthError();
    if (!response.ok) {
      let detail = '';
      try {
        const body = (await response.json()) as { message?: string };
        detail = body.message ? `: ${body.message}` : '';
      } catch {
        detail = '';
      }
      if (response.status === 404) throw new NotFoundError(`Not found${detail}`);
      throw new GithubError(`GitHub request failed (${response.status})${detail}`, response.status, response.headers);
    }
    if (raw) return response as unknown as T;
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async paginate<T>(path: string, perPage = 100, maxPages = 10): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const separator = path.includes('?') ? '&' : '?';
      const chunk = await this.request<T[]>(`${path}${separator}per_page=${perPage}&page=${page}`);
      all.push(...chunk);
      if (chunk.length < perPage) break;
    }
    return all;
  }
}

export function tokenKind(token: string): 'classic' | 'fine-grained' {
  return token.startsWith('github_pat_') ? 'fine-grained' : 'classic';
}
