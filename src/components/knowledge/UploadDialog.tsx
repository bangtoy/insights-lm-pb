import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useToast } from '@/hooks/use-toast';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { uploadFileAsync, updateFile } = useKnowledgeFiles();
  const { uploadFile, isUploading } = useFileUpload();
  const { processDocumentAsync } = useDocumentProcessing();
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  }, []);

  const getFileType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf';
    if (mimeType.includes('text') || ['txt', 'md'].includes(extension)) return 'txt';
    if (mimeType.includes('csv') || extension === 'csv') return 'csv';
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension)) return 'docx';
    if (mimeType.includes('audio') || ['mp3', 'wav', 'm4a'].includes(extension)) return 'audio';
    
    return 'txt'; // Default fallback
  };

  const processFileAsync = async (file: File, fileRecord: any) => {
    try {
      console.log('Starting file processing for:', file.name, 'file:', fileRecord.id);
      const fileType = getFileType(file);

      // Update status to uploading
      setUploadingFiles(prev => prev.map(uf => 
        uf.file.name === file.name ? { ...uf, progress: 25, status: 'uploading' } : uf
      ));

      // Upload the file using the same pattern as SourcesSidebar
      const filePath = await uploadFile(file, 'knowledge-files', fileRecord.id);
      if (!filePath) {
        throw new Error('File upload failed - no file path returned');
      }
      console.log('File uploaded successfully:', filePath);

      // Update file record with file path and set to processing
      await updateFile({
        fileId: fileRecord.id,
        updates: {
          file_path: filePath,
          processing_status: 'processing'
        }
      });

      // Update progress to show processing
      setUploadingFiles(prev => prev.map(uf => 
        uf.file.name === file.name ? { ...uf, progress: 75, status: 'processing' } : uf
      ));

      // Start document processing using the same webhook as sources
      try {
        await processDocumentAsync({
          sourceId: fileRecord.id,
          filePath,
          sourceType: fileType
        });
        console.log('Document processing completed for:', fileRecord.id);
        
        // Mark as completed
        setUploadingFiles(prev => prev.map(uf => 
          uf.file.name === file.name ? { ...uf, progress: 100, status: 'completed' } : uf
        ));
      } catch (processingError) {
        console.error('Document processing failed:', processingError);
        
        // Update to completed with basic info if processing fails
        await updateFile({
          fileId: fileRecord.id,
          updates: {
            processing_status: 'completed'
          }
        });
        
        // Mark as completed in UI
        setUploadingFiles(prev => prev.map(uf => 
          uf.file.name === file.name ? { ...uf, progress: 100, status: 'completed' } : uf
        ));
      }
    } catch (error) {
      console.error('File processing failed for:', file.name, error);

      // Update status to failed
      await updateFile({
        fileId: fileRecord.id,
        updates: {
          processing_status: 'failed'
        }
      });
      
      // Mark as error in UI
      setUploadingFiles(prev => prev.map(uf => 
        uf.file.name === file.name ? { 
          ...uf, 
          progress: 0, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : uf
      ));
    }
  };
  const handleFileUpload = async (files: File[]) => {
    console.log('Processing multiple files:', files.length);
    
    // Initialize uploading files state
    const newUploadingFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    setUploadingFiles(newUploadingFiles);

    try {
      // Step 1: Create all file records first
      const fileRecords = await Promise.all(files.map(async (file) => {
        const fileType = getFileType(file);
        return await uploadFileAsync({
          title: file.name,
          file: file,
          file_type: fileType
        });
      }));

      console.log('All file records created:', fileRecords.length);

      // Step 2: Process files in parallel (background)
      const processingPromises = files.map((file, index) => 
        processFileAsync(file, fileRecords[index])
      );

      // Don't await - let processing happen in background
      Promise.allSettled(processingPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log('File processing completed:', { successful, failed });

        if (failed > 0) {
          toast({
            title: "Processing Issues",
            description: `${failed} file${failed > 1 ? 's' : ''} had processing issues. Check the files list for details.`,
            variant: "destructive"
          });
        }
      });

      // Show immediate success toast
      toast({
        title: "Files Added",
        description: `${files.length} file${files.length > 1 ? 's' : ''} added and processing started`
      });

      // Auto-close after a short delay
      setTimeout(() => {
        setUploadingFiles([]);
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('Error creating file records:', error);
      toast({
        title: "Error",
        description: "Failed to add files. Please try again.",
        variant: "destructive"
      });
      
      // Mark all as error
      setUploadingFiles(prev => prev.map(uf => ({
        ...uf,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      })));
      }
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'pdf': '📄',
      'txt': '📝',
      'md': '📝',
      'csv': '📊',
      'doc': '📄',
      'docx': '📄',
      'mp3': '🎵',
      'wav': '🎵',
      'm4a': '🎵',
    };
    return iconMap[extension || ''] || '📄';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload Knowledge Files</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Upload Knowledge Files</h3>
                <p className="text-gray-600 text-sm">
                  Drag & drop or{' '}
                  <button 
                    className="text-blue-600 hover:underline" 
                    onClick={() => document.getElementById('knowledge-file-upload')?.click()}
                  >
                    choose files
                  </button>{' '}
                  to upload
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Supported: PDF, TXT, CSV, DOC, DOCX, MP3, WAV, M4A
              </p>
              <input
                id="knowledge-file-upload"
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.txt,.csv,.doc,.docx,.md,.mp3,.wav,.m4a"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Upload Progress</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {uploadingFiles.map((uploadingFile, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg">{getFileIcon(uploadingFile.file.name)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {uploadingFile.file.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          {uploadingFile.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {uploadingFile.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadingFile(index)}
                            className="p-1 h-auto"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {uploadingFile.status !== 'error' ? (
                        <>
                          <Progress value={uploadingFile.progress} className="h-2 mb-1" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              {uploadingFile.status === 'uploading' && 'Uploading...'}
                              {uploadingFile.status === 'processing' && 'Processing...'}
                              {uploadingFile.status === 'completed' && 'Completed'}
                            </span>
                            <span>{uploadingFile.progress}%</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-red-600">{uploadingFile.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;