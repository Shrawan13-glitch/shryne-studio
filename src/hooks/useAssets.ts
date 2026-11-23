import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssetQuery } from '@/lib/storage/db';
import { deleteAsset, listAssets, saveAsset } from '@/lib/storage/db';
import type { AudioAsset } from '@/types';

export const ASSETS_KEY = ['assets'] as const;

export function useAssets(query: AssetQuery = {}) {
  return useQuery({
    queryKey: [...ASSETS_KEY, query],
    queryFn: () => listAssets(query),
    staleTime: 10_000,
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: AudioAsset) => saveAsset(asset),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
}
