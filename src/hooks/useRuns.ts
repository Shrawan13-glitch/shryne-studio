import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompiledScript, GenerationRun, RunConfig, StudioConfig } from '@/types';
import { listRuns } from '@/lib/storage/db';
import {
  cancelRun, downloadOutputs, pollRun, removeLocalRun, retryShard, startRun,
} from '@/lib/run/engine';

const KEY = ['runs'] as const;

export function useRuns() {
  return useQuery({ queryKey: KEY, queryFn: () => listRuns(100), staleTime: 5000, refetchInterval: 8000 });
}

interface StartArgs {
  studio: StudioConfig;
  scriptId: string;
  scriptTitle: string;
  compiled: CompiledScript;
  config: RunConfig;
}

export function useStartRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studio, scriptId, scriptTitle, compiled, config }: StartArgs) =>
      startRun(studio, scriptId, scriptTitle, compiled, config),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRunPoller(studio: StudioConfig | null) {
  const queryClient = useQueryClient();
  return useCallback(async (run: GenerationRun) => {
    if (!studio) return run;
    const updated = await pollRun(studio, run);
    queryClient.setQueryData<GenerationRun[]>(KEY, (old) =>
      old?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated],
    );
    return updated;
  }, [studio, queryClient]);
}

export function useDownloadOutputs(studio: StudioConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ run, compiled }: { run: GenerationRun; compiled: CompiledScript }) => {
      if (!studio) throw new Error('Connect GitHub first');
      return downloadOutputs(studio, run, compiled);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useCancelRun(studio: StudioConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (run: GenerationRun) => {
      if (!studio) throw new Error('Connect GitHub first');
      return cancelRun(studio, run);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRetryShard(studio: StudioConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ run, compiled, indices }: { run: GenerationRun; compiled: CompiledScript; indices: number[] }) => {
      if (!studio) throw new Error('Connect GitHub first');
      return retryShard(studio, run, compiled, indices);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveRun(studio: StudioConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (run: GenerationRun) => {
      if (!studio) throw new Error('Connect GitHub first');
      return removeLocalRun(studio, run);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
