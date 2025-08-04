import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreVertical, FileText, Edit, Trash2, Eye, Clock, HardDrive, Hash, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { KnowledgeFile, useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';
import { formatDistanceToNow } from 'date-fns';
import FileDetailsDialog from './FileDetailsDialog';
import RenameFileDialog from './RenameFileDialog';

interface KnowledgeCardProps {
  file: KnowledgeFile;
  viewMode: 'grid' | 'list';
}

const KnowledgeCard = ({ file, viewMode }: KnowledgeCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteFile, isDeleting } = useKnowledgeFiles();

  const getFileIcon = (fileType: string) => {
    const iconMap: Record<string, string> = {
      'pdf': '📄',
      'txt': '📝',
      'csv': '📊',
      'docx': '📄',
      'doc': '📄',
      'audio': '🎵',
      'mp3': '🎵',
      'wav': '🎵',
    };
    return iconMap[fileType.toLowerCase()] || '📄';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = () => {
    deleteFile(file.id);
    setShowDeleteDialog(false);
  };

  if (viewMode === 'list') {
    return (
      <>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="text-2xl">{getFileIcon(file.file_type)}</div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{file.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HardDrive className="h-3 w-3" />
                    <span>{formatFileSize(file.file_size)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Hash className="h-3 w-3" />
                    <span>{file.chunk_count} chunks</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {getStatusIcon(file.processing_status)}
                <Badge variant="outline" className="text-xs">
                  {file.processing_status}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRename(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        <FileDetailsDialog 
          file={file}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
        
        <RenameFileDialog 
          file={file}
          open={showRename}
          onOpenChange={setShowRename}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {file.title}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the file and all its chunks. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setShowDetails(true)}>
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{getFileIcon(file.file_type)}</div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowRename(true); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{file.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <HardDrive className="h-3 w-3" />
              <span>{formatFileSize(file.file_size)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>{file.chunk_count} chunks</span>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
            </span>
            <div className="flex items-center space-x-1">
              {getStatusIcon(file.processing_status)}
              <Badge variant="outline" className="text-xs">
                {file.processing_status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <FileDetailsDialog 
        file={file}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
      
      <RenameFileDialog 
        file={file}
        open={showRename}
        onOpenChange={setShowRename}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {file.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file and all its chunks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KnowledgeCard;