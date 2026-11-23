import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Script } from '@/types';
import { deleteScript, listScripts, saveScript } from '@/lib/storage/db';

const KEY = ['scripts'] as const;

export function useScripts() {
  return useQuery({ queryKey: KEY, queryFn: listScripts, staleTime: 10_000 });
}

export function useSaveScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (script: Script) => saveScript(script),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScript(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
