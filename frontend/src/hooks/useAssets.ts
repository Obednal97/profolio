import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Asset } from '@/types/global';

interface AssetSummary {
  totalValue: number;
  assetsByType: Record<string, number>;
  percentageChange: number;
}

interface AssetHistory {
  date: string;
  totalValue: number;
}

export function useAssets(type?: string) {
  return useQuery({
    queryKey: ['assets', type],
    queryFn: () => apiClient.get<Asset[]>('/api/assets', type ? { type } : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => apiClient.get<Asset>(`/api/assets/${id}`),
    enabled: !!id,
  });
}

export function useAssetSummary() {
  return useQuery({
    queryKey: ['assets', 'summary'],
    queryFn: () => apiClient.get<AssetSummary>('/api/assets/summary'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssetHistory(days: number = 30) {
  return useQuery({
    queryKey: ['assets', 'history', days],
    queryFn: () => apiClient.get<AssetHistory[]>('/api/assets/history', { days }),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiClient.post<Asset>('/api/assets', data),
    onSuccess: (newAsset) => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      // Optimistically update the cache
      queryClient.setQueryData<Asset[]>(['assets'], (old) => {
        if (!old) return [newAsset];
        return [...old, newAsset];
      });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) =>
      apiClient.patch<Asset>(`/api/assets/${id}`, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['assets', id] });

      // Snapshot previous value
      const previousAsset = queryClient.getQueryData<Asset>(['assets', id]);

      // Optimistically update
      queryClient.setQueryData<Asset>(['assets', id], (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Update in list
      queryClient.setQueryData<Asset[]>(['assets'], (old) => {
        if (!old) return old;
        return old.map(asset => 
          asset.id === id ? { ...asset, ...data } : asset
        );
      });

      return { previousAsset };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(['assets', id], context.previousAsset);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/assets/${id}`),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['assets'] });

      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<Asset[]>(['assets']);

      // Optimistically remove from list
      queryClient.setQueryData<Asset[]>(['assets'], (old) => {
        if (!old) return old;
        return old.filter(asset => asset.id !== id);
      });

      return { previousAssets };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(['assets'], context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
} 