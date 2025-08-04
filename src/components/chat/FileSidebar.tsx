import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, X, CheckSquare, Square, FileText } from 'lucide-react';
import { KnowledgeFile } from '@/hooks/useKnowledgeFiles';

interface FileSidebarProps {
  files: KnowledgeFile[];
  selectedFiles: string[];
  onFileToggle: (fileId: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
  isDesktop: boolean;
}

const FileSidebar = ({ 
  files, 
  selectedFiles, 
  onFileToggle, 
  onSelectAll, 
  onClose, 
  isDesktop 
}: FileSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allSelected = filteredFiles.length > 0 && filteredFiles.every(file => selectedFiles.includes(file.id));
  const someSelected = filteredFiles.some(file => selectedFiles.includes(file.id));

  const getFileIcon = (fileType: string) => {
    const iconMap: Record<string, string> = {
      'pdf': '📄',
      'txt': '📝',
      'csv': '📊',
      'docx': '📄',
      'audio': '🎵',
    };
    return iconMap[fileType.toLowerCase()] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Select Files</h2>
          {!isDesktop && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Select All */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="flex items-center space-x-2"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : someSelected ? (
              <div className="h-4 w-4 border border-gray-400 bg-gray-200 rounded-sm flex items-center justify-center">
                <div className="h-2 w-2 bg-gray-600 rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>Select All</span>
          </Button>
          
          <Badge variant="outline" className="text-xs">
            {selectedFiles.length} selected
          </Badge>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedFiles.includes(file.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onFileToggle(file.id)}
            >
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onChange={() => onFileToggle(file.id)}
                className="pointer-events-none"
              />
              
              <div className="text-lg">{getFileIcon(file.file_type)}</div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate text-sm">
                  {file.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {file.file_type.toUpperCase()}
                  </Badge>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span>{file.chunk_count} chunks</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {searchQuery ? 'No files match your search' : 'No files available'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileSidebar;