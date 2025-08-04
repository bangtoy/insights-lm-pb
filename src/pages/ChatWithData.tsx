import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInterface from '@/components/chat/ChatInterface';
import FileSidebar from '@/components/chat/FileSidebar';
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const ChatWithData = () => {
  const { user } = useAuth();
  const { files } = useKnowledgeFiles();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files?.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files?.map(f => f.id) || []);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <ChatHeader 
        userEmail={user?.email}
        selectedFilesCount={selectedFiles.length}
        totalFilesCount={files?.length || 0}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* File Selection Sidebar */}
        {(isDesktop || sidebarOpen) && (
          <div className={`${isDesktop ? 'w-80' : 'w-full'} flex-shrink-0`}>
            <FileSidebar
              files={files || []}
              selectedFiles={selectedFiles}
              onFileToggle={handleFileToggle}
              onSelectAll={handleSelectAll}
              onClose={() => setSidebarOpen(false)}
              isDesktop={isDesktop}
            />
          </div>
        )}
        
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            selectedFiles={selectedFiles}
            files={files || []}
            onFileToggle={handleFileToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWithData;