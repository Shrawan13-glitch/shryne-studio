import type { GithubClient } from './client';

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
}

export async function listArtifacts(client: GithubClient, repo: string, runId: number): Promise<Artifact[]> {
  const response = await client.request<{ artifacts: Artifact[] }>(
    `/repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
  );
  return response.artifacts.filter((a) => !a.expired);
}

/** Downloads the artifact zip. The GitHub URL redirects to a signed URL; fetch follows it but we must strip auth on the redirect hop. */
export async function downloadArtifactZip(client: GithubClient, artifact: Artifact): Promise<Uint8Array> {
  const first = await fetch(artifact.archive_download_url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${client.token}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
    redirect: 'manual',
  });
  const location = first.headers.get('location');
  const finalResponse = location ? await fetch(location) : first;
  if (!finalResponse.ok) {
    throw new Error(`Artifact download failed (${finalResponse.status})`);
  }
  return new Uint8Array(await finalResponse.arrayBuffer());
}
