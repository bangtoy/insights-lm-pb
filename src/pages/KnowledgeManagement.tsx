import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import KnowledgeGrid from '@/components/knowledge/KnowledgeGrid';
import EmptyKnowledge from '@/components/knowledge/EmptyKnowledge';
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';

const KnowledgeManagement = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { files, isLoading, error, isError } = useKnowledgeFiles();
  const hasFiles = files && files.length > 0;

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KnowledgeHeader userEmail={user?.email} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-gray-900 mb-2">Knowledge Management</h1>
          </div>
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show auth error if present
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KnowledgeHeader userEmail={user?.email} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-gray-900 mb-2">Knowledge Management</h1>
          </div>
          <div className="text-center py-16">
            <p className="text-red-600">Authentication error: {authError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Show files loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KnowledgeHeader userEmail={user?.email} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-gray-900 mb-2">Knowledge Management</h1>
          </div>
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your knowledge files...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show files error if present
  if (isError && error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KnowledgeHeader userEmail={user?.email} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-medium text-gray-900 mb-2">Knowledge Management</h1>
          </div>
          <div className="text-center py-16">
            <p className="text-red-600">Error loading files: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <KnowledgeHeader userEmail={user?.email} />
      
      <main className="max-w-7xl mx-auto px-6 py-[60px]">
        <div className="mb-8">
          <h1 className="font-medium text-gray-900 mb-2 text-5xl">Knowledge Management</h1>
          <p className="text-gray-600 text-lg">Upload, organize, and manage your knowledge files</p>
        </div>

        {hasFiles ? <KnowledgeGrid /> : <EmptyKnowledge />}
      </main>
    </div>
  );
};

export default KnowledgeManagement;