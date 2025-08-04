import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Send, Download, Trash2, MessageCircle, FileText, Bot, User, Loader2 } from 'lucide-react';
import { KnowledgeFile } from '@/hooks/useKnowledgeFiles';
import { useChatHistory } from '@/hooks/useChatHistory';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  selectedFiles: string[];
  files: KnowledgeFile[];
  onFileToggle: (fileId: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    file_id: string;
    file_name: string;
    chunk_index: number;
    excerpt: string;
  }>;
  timestamp: Date;
}

const ChatInterface = ({ selectedFiles, files, onFileToggle }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { messages, sendMessage, clearHistory, exportChat, isSending } = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedFileNames = files
    .filter(f => selectedFiles.includes(f.id))
    .map(f => f.title);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || selectedFiles.length === 0) return;

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    try {
      await sendMessage({
        content: userMessage,
        selectedFiles: selectedFiles
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeSelectedFile = (fileId: string) => {
    onFileToggle(fileId);
  };

  const getSuggestions = () => {
    if (selectedFiles.length === 0) return [];
    
    return [
      "What are the main topics covered in these files?",
      "Summarize the key points from the selected documents",
      "What insights can you extract from this data?",
      "Compare the information across these files"
    ];
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Context Bar */}
      {selectedFiles.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Chatting with {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFileNames.map((name, index) => (
              <Badge 
                key={selectedFiles[index]} 
                variant="secondary" 
                className="bg-white text-blue-800 border-blue-200"
              >
                <FileText className="h-3 w-3 mr-1" />
                {name}
                <button
                  onClick={() => removeSelectedFile(selectedFiles[index])}
                  className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFiles.length === 0 
                  ? 'Select files to start chatting'
                  : 'Start a conversation with your data'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedFiles.length === 0
                  ? 'Choose files from the sidebar to begin asking questions'
                  : 'Ask questions about your selected files and get intelligent answers'
                }
              </p>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                  <div className="grid gap-2 max-w-md mx-auto">
                    {getSuggestions().map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(suggestion)}
                        className="text-left justify-start h-auto py-2 px-3"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-4`}>
                    <div className="flex items-start space-x-2 mb-2">
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 mt-0.5 text-blue-200" />
                      ) : (
                        <Bot className="h-4 w-4 mt-0.5 text-gray-600" />
                      )}
                      <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-600'}`}>
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>
                    
                    <div className={msg.role === 'user' ? 'text-white' : 'text-gray-900'}>
                      <MarkdownRenderer content={msg.content} />
                    </div>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, index) => (
                            <div key={index} className="text-xs bg-white p-2 rounded border">
                              <span className="font-medium">{source.file_name}</span>
                              <span className="text-gray-500"> • Chunk {source.chunk_index + 1}</span>
                              <p className="text-gray-700 mt-1 italic">"{source.excerpt}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-gray-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          {/* Chat Controls */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Chat</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChat}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
                </Button>
              </div>
              
              <span className="text-xs text-gray-500">
                {messages.length} message{messages.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          {/* Message Input */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder={
                  selectedFiles.length === 0 
                    ? "Select files from the sidebar to start chatting..."
                    : "Ask a question about your selected files..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={selectedFiles.length === 0 || isSending}
                className="text-base"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || selectedFiles.length === 0 || isSending}
              className="px-6"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI responses are based on your selected knowledge files and may contain inaccuracies
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;