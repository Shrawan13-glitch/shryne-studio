import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StudioConfig } from '@/types';
import { clearCredentials, inspectToken, loadStudioConfig, saveStudioConfig, saveToken } from '@/lib/github/auth';
import { GithubClient } from '@/lib/github/client';
import { provisionStudio } from '@/lib/github/repo';

const KEY = ['studio'] as const;

export function useStudioConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<StudioConfig | null> => loadStudioConfig(),
    staleTime: Infinity,
  });
}

export function useTokenInspection(token: string | null) {
  return useQuery({
    queryKey: ['token-info', token],
    queryFn: () => inspectToken(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export interface ConnectInput {
  token: string;
  onProgress?: (stage: string) => void;
}

export function useConnectStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, onProgress }: ConnectInput): Promise<StudioConfig> => {
      onProgress?.('Validating token');
      const info = await inspectToken(token);
      onProgress?.('Preparing public repo');
      const result = await provisionStudio(
        new GithubClient(token),
        info.user.login,
        token,
        info.kind,
      );
      onProgress?.('Saving settings');
      await saveToken(token);
      await saveStudioConfig(result.config);
      return result.config;
    },
    onSuccess: (config) => {
      queryClient.setQueryData(KEY, config);
      void queryClient.invalidateQueries({ queryKey: ['studio'] });
    },
  });
}

export function useDisconnectStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCredentials,
    onSuccess: () => {
      queryClient.setQueryData(KEY, null);
      void queryClient.clear();
    },
  });
}
