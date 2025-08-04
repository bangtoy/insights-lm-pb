import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const useChatHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, selectedFiles }: { content: string; selectedFiles: string[] }) => {
      if (!user) throw new Error('User not authenticated');

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on your selected files, here's what I found about "${content}". This is a simulated response that would normally come from processing your knowledge base files.`,
        sources: [
          {
            file_id: selectedFiles[0] || '',
            file_name: 'Sample Document.pdf',
            chunk_index: 0,
            excerpt: 'This is a sample excerpt from the document that relates to your question...'
          }
        ],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      return aiResponse;
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearHistory = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Chat history has been cleared.",
    });
  };

  const exportChat = () => {
    const chatText = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}\n${msg.sources ? 'Sources: ' + msg.sources.map(s => s.file_name).join(', ') + '\n' : ''}`
    ).join('\n---\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat Exported",
      description: "Chat history has been exported as a text file.",
    });
  };

  return {
    messages,
    sendMessage: sendMessage.mutate,
    sendMessageAsync: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    clearHistory,
    exportChat,
  };
};