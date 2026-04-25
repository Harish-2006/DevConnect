
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PostActionsProps {
  postId: string;
  content: string;
  userId: string;
  currentUserId: string;
  onUpdate: () => void;
}

const PostActions = ({ postId, content, userId, currentUserId, onUpdate }: PostActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Only show actions if this is the current user's post
  if (userId !== currentUserId) return null;

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      setShowEditDialog(false);
      onUpdate();
      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      onUpdate();
      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="glass-input min-h-[100px]"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="glass-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={updating || !editContent.trim()}
                className="bg-neon-blue hover:bg-neon-blue/80 text-black"
              >
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostActions;
