import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Edit, Trash2, Save, X, Split, Merge, Clock, HardDrive, Hash } from 'lucide-react';
import { KnowledgeFile } from '@/hooks/useKnowledgeFiles';
import { useFileChunks } from '@/hooks/useFileChunks';
import { formatDistanceToNow } from 'date-fns';

interface FileDetailsDialogProps {
  file: KnowledgeFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FileDetailsDialog = ({ file, open, onOpenChange }: FileDetailsDialogProps) => {
  const { chunks, updateChunk, deleteChunk, splitChunk, mergeChunks, isUpdating, isDeleting } = useFileChunks(file.id);
  const [editingChunk, setEditingChunk] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEditChunk = (chunkId: string, content: string) => {
    setEditingChunk(chunkId);
    setEditContent(content);
  };

  const handleSaveChunk = () => {
    if (editingChunk && editContent.trim()) {
      updateChunk({ chunkId: editingChunk, content: editContent.trim() });
      setEditingChunk(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingChunk(null);
    setEditContent('');
  };

  const handleDeleteChunk = (chunkId: string) => {
    setChunkToDelete(chunkId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteChunk = () => {
    if (chunkToDelete) {
      deleteChunk(chunkToDelete);
      setChunkToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleChunkSelection = (chunkId: string) => {
    setSelectedChunks(prev => 
      prev.includes(chunkId) 
        ? prev.filter(id => id !== chunkId)
        : [...prev, chunkId]
    );
  };

  const handleMergeSelected = () => {
    if (selectedChunks.length >= 2) {
      mergeChunks(selectedChunks);
      setSelectedChunks([]);
    }
  };

  const handleSplitChunk = (chunkId: string, splitPoint: number) => {
    splitChunk({ chunkId, splitPoint });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>{file.title}</span>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chunks">Chunks ({file.chunk_count})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Updated</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Size</span>
                  </div>
                  <p className="text-sm text-gray-900">{formatFileSize(file.file_size)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Chunks</span>
                  </div>
                  <p className="text-sm text-gray-900">{file.chunk_count}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Type</span>
                  </div>
                  <Badge variant="outline">{file.file_type.toUpperCase()}</Badge>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Processing Status</h4>
                <Badge 
                  variant={file.processing_status === 'completed' ? 'default' : 'outline'}
                  className={
                    file.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                    file.processing_status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    file.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {file.processing_status}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="chunks" className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {selectedChunks.length > 0 && (
                    <>
                      <span className="text-sm text-gray-600">
                        {selectedChunks.length} selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMergeSelected}
                        disabled={selectedChunks.length < 2}
                      >
                        <Merge className="h-4 w-4 mr-1" />
                        Merge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedChunks([])}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {chunks?.map((chunk, index) => (
                    <div 
                      key={chunk.id} 
                      className={`border rounded-lg p-4 ${
                        selectedChunks.includes(chunk.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedChunks.includes(chunk.id)}
                            onChange={() => handleChunkSelection(chunk.id)}
                            className="rounded"
                          />
                          <Badge variant="outline" className="text-xs">
                            Chunk {index + 1}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {editingChunk === chunk.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveChunk}
                                disabled={isUpdating}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditChunk(chunk.id, chunk.content)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteChunk(chunk.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingChunk === chunk.id ? (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-24 resize-y"
                          placeholder="Edit chunk content..."
                        />
                      ) : (
                        <div 
                          className="text-sm text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => handleEditChunk(chunk.id, chunk.content)}
                        >
                          {chunk.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chunk?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chunk. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteChunk}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FileDetailsDialog;