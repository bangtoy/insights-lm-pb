import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FileChunk {
  id: string;
  file_id: string;
  content: string;
  chunk_index: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useFileChunks = (fileId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chunks, isLoading } = useQuery({
    queryKey: ['file-chunks', fileId],
    queryFn: async () => {
      if (!fileId) return [];
      
      const { data, error } = await supabase
        .from('file_chunks')
        .select('*')
        .eq('file_id', fileId)
        .order('chunk_index', { ascending: true });
      
      if (error) throw error;
      return data as FileChunk[];
    },
    enabled: !!fileId && !!user,
  });

  const updateChunk = useMutation({
    mutationFn: async ({ chunkId, content }: { chunkId: string; content: string }) => {
      const { data, error } = await supabase
        .from('file_chunks')
        .update({ 
          content,
          updated_at: new Date().toISOString() 
        })
        .eq('id', chunkId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-chunks', fileId] });
    },
  });

  const deleteChunk = useMutation({
    mutationFn: async (chunkId: string) => {
      const { error } = await supabase
        .from('file_chunks')
        .delete()
        .eq('id', chunkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-chunks', fileId] });
    },
  });

  const splitChunk = useMutation({
    mutationFn: async ({ 
      chunkId, 
      splitPoint 
    }: { 
      chunkId: string; 
      splitPoint: number;
    }) => {
      const chunk = chunks?.find(c => c.id === chunkId);
      if (!chunk) throw new Error('Chunk not found');

      const content1 = chunk.content.substring(0, splitPoint);
      const content2 = chunk.content.substring(splitPoint);

      // Update original chunk
      await supabase
        .from('file_chunks')
        .update({ content: content1 })
        .eq('id', chunkId);

      // Create new chunk
      const { error } = await supabase
        .from('file_chunks')
        .insert({
          file_id: chunk.file_id,
          content: content2,
          chunk_index: chunk.chunk_index + 0.5,
          metadata: chunk.metadata
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-chunks', fileId] });
    },
  });

  const mergeChunks = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (chunkIds.length < 2) throw new Error('Need at least 2 chunks to merge');

      const chunksToMerge = chunks?.filter(c => chunkIds.includes(c.id))
        .sort((a, b) => a.chunk_index - b.chunk_index);

      if (!chunksToMerge || chunksToMerge.length < 2) {
        throw new Error('Chunks not found');
      }

      const mergedContent = chunksToMerge.map(c => c.content).join('\n\n');
      const firstChunk = chunksToMerge[0];

      // Update first chunk with merged content
      await supabase
        .from('file_chunks')
        .update({ content: mergedContent })
        .eq('id', firstChunk.id);

      // Delete other chunks
      const { error } = await supabase
        .from('file_chunks')
        .delete()
        .in('id', chunkIds.slice(1));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-chunks', fileId] });
    },
  });

  return {
    chunks,
    isLoading,
    updateChunk: updateChunk.mutate,
    isUpdating: updateChunk.isPending,
    deleteChunk: deleteChunk.mutate,
    isDeleting: deleteChunk.isPending,
    splitChunk: splitChunk.mutate,
    isSplitting: splitChunk.isPending,
    mergeChunks: mergeChunks.mutate,
    isMerging: mergeChunks.isPending,
  };
};