import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Database, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadDialog from './UploadDialog';

const EmptyKnowledge = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="text-center py-16">
      <div className="mb-12">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Database className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-medium text-gray-900 mb-4">Build Your Knowledge Base</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your documents, PDFs, and text files to create a searchable knowledge base. 
          Then chat with your data to get instant insights and answers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
          <p className="text-gray-600">PDFs, Word docs, text files, and more</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Database className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Organize Knowledge</h3>
          <p className="text-gray-600">Automatic chunking and smart organization</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat with Data</h3>
          <p className="text-gray-600">Ask questions and get intelligent answers</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => setShowUploadDialog(true)} 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Knowledge Files
        </Button>
        
        <Button 
          variant="outline"
          size="lg"
          onClick={() => navigate('/chat')}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Go to Chat
        </Button>
      </div>

      <UploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
      />
    </div>
  );
};

export default EmptyKnowledge;