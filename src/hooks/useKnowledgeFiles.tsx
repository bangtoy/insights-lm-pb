import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KnowledgeFile {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_size: number;
  file_type: string;
  chunk_count: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FileChunk {
  id: string;
  file_id: string;
  content: string;
  chunk_index: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeFiles = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: files = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['knowledge-files', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, returning empty files array');
        return [];
      }
      
      console.log('Fetching knowledge files for user:', user.id);
      
      // Get files with chunk counts
      const { data: filesData, error: filesError } = await supabase
        .from('knowledge_files')
        .select(`
          *,
          chunks:file_chunks(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (filesError) {
        console.error('Error fetching knowledge files:', filesError);
        throw filesError;
      }

      // Transform the data to include chunk count
      const transformedFiles = (filesData || []).map(file => ({
        ...file,
        chunk_count: file.chunks?.[0]?.count || 0
      }));

      console.log('Fetched knowledge files:', transformedFiles?.length || 0);
      return transformedFiles;
    },
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Set up real-time subscription for files updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    console.log('Setting up real-time subscription for knowledge files');

    const channel = supabase
      .channel('knowledge-files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_files',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time knowledge file update received:', payload);
          
          // Invalidate and refetch files when any change occurs
          queryClient.invalidateQueries({ queryKey: ['knowledge-files', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated, queryClient]);

  const uploadFile = useMutation({
    mutationFn: async (fileData: { 
      title: string; 
      file: File;
      file_type: string;
    }) => {
      console.log('Uploading knowledge file:', fileData.title);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First create the file record
      const { data: fileRecord, error: createError } = await supabase
        .from('knowledge_files')
        .insert({
          title: fileData.title,
          file_type: fileData.file_type,
          file_size: fileData.file.size,
          user_id: user.id,
          processing_status: 'pending',
          metadata: {
            originalName: fileData.file.name,
            mimeType: fileData.file.type
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating file record:', createError);
        throw createError;
      }

      // Upload file to storage
      const fileExtension = fileData.file.name.split('.').pop() || 'bin';
      const filePath = `${user.id}/${fileRecord.id}.${fileExtension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('knowledge-files')
        .upload(filePath, fileData.file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Clean up the database record
        await supabase.from('knowledge_files').delete().eq('id', fileRecord.id);
        throw uploadError;
      }

      // Update file record with path
      const { data: updatedFile, error: updateError } = await supabase
        .from('knowledge_files')
        .update({ 
          file_path: filePath,
          processing_status: 'processing'
        })
        .eq('id', fileRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating file record:', updateError);
        throw updateError;
      }

      // Process the file (same webhook as existing system)
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          sourceId: fileRecord.id,
          filePath: filePath,
          sourceType: fileData.file_type
        }
      });

      if (processError) {
        console.error('Error processing file:', processError);
        // Don't throw here - file is uploaded, processing can be retried
      }

      return updatedFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', user?.id] });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      // Get file details first
      const { data: file } = await supabase
        .from('knowledge_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      // Delete from storage if file path exists
      if (file?.file_path) {
        await supabase.storage
          .from('knowledge-files')
          .remove([file.file_path]);
      }

      // Delete file record (this will cascade delete chunks)
      const { error } = await supabase
        .from('knowledge_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', user?.id] });
    },
  });

  const updateFile = useMutation({
    mutationFn: async ({ fileId, updates }: { 
      fileId: string; 
      updates: { title?: string; metadata?: any } 
    }) => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', user?.id] });
    },
  });

  return {
    files,
    isLoading: authLoading || isLoading,
    error: error?.message || null,
    isError,
    uploadFile: uploadFile.mutate,
    uploadFileAsync: uploadFile.mutateAsync,
    isUploading: uploadFile.isPending,
    deleteFile: deleteFile.mutate,
    isDeleting: deleteFile.isPending,
    updateFile: updateFile.mutate,
    isUpdating: updateFile.isPending,
  };
};