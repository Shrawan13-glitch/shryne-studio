import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loadStudioConfig } from '@/lib/github/auth';
import { useAppStore } from '@/stores/useAppStore';

/** Hydrates the persisted studio connection into global state once at startup. */
export function useSetAtomCompat() {
  const queryClient = useQueryClient();
  const setStudio = useAppStore((state) => state.setStudio);
  return useCallback(async () => {
    const config = await loadStudioConfig();
    setStudio(config);
    queryClient.setQueryData(['studio'], config);
  }, [setStudio, queryClient]);
}
