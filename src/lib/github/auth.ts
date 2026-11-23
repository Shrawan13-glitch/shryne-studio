import * as SecureStore from 'expo-secure-store';
import type { StudioConfig } from '@/types';
import { GithubClient, tokenKind } from './client';

const TOKEN_KEY = 'shryne.github.token';
const CONFIG_KEY = 'shryne.studio.config';

export interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token.trim());
}

export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(CONFIG_KEY);
}

export async function validateToken(token: string): Promise<GithubUser> {
  const client = new GithubClient(token);
  return client.request<GithubUser>('/user');
}

export async function inspectToken(token: string): Promise<{ user: GithubUser; kind: 'classic' | 'fine-grained'; scopes: string[] }> {
  const client = new GithubClient(token);
  const user = await client.request<GithubUser>('/user');
  // /user does not expose scopes on the response body; re-request to read headers via a raw fetch.
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  const scopes = (response.headers.get('x-oauth-scopes') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return { user, kind: tokenKind(token), scopes };
}

export async function saveStudioConfig(config: StudioConfig): Promise<void> {
  await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(config));
}

export async function loadStudioConfig(): Promise<StudioConfig | null> {
  const raw = await SecureStore.getItemAsync(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudioConfig;
  } catch {
    return null;
  }
}
