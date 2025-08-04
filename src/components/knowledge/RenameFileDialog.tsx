import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KnowledgeFile, useKnowledgeFiles } from '@/hooks/useKnowledgeFiles';

interface RenameFileDialogProps {
  file: KnowledgeFile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RenameFileDialog = ({ file, open, onOpenChange }: RenameFileDialogProps) => {
  const [title, setTitle] = useState('');
  const { updateFile, isUpdating } = useKnowledgeFiles();

  useEffect(() => {
    if (file && open) {
      setTitle(file.title);
    }
  }, [file, open]);

  const handleSave = () => {
    if (title.trim() && title !== file.title) {
      updateFile({
        fileId: file.id,
        updates: { title: title.trim() }
      });
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle(file.title);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-title">File Name</Label>
            <Input
              id="file-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter file name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim() || title === file.title || isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameFileDialog;