
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: string, sourceId: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Get file extension
      const fileExtension = file.name.split('.').pop() || 'bin';
      
      // Create file path based on bucket type
      const filePath = bucket === 'knowledge-files' 
        ? `${sourceId}.${fileExtension}`  // For knowledge files: {file_id}.{extension}
        : `${bucket}/${sourceId}.${fileExtension}`; // For sources: {notebook_id}/{source_id}.{extension}
      
      console.log('Uploading file to:', filePath);
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket === 'knowledge-files' ? 'knowledge-files' : 'sources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      return filePath;
    } catch (error) {
      console.error('File upload failed:', error);
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('sources')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    uploadFile,
    getFileUrl,
    isUploading,
  };
};
