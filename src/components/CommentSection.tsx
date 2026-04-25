import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface CommentSectionProps {
  postId: string;
  userId: string; // logged-in user
  postOwnerId: string; // owner of the post
  commentsCount: number;
  alwaysOpen?: boolean;
  onDeleteComment?: (commentId: string) => void; // <--- added this
}

const CommentSection = ({
  postId,
  userId,
  postOwnerId,
  commentsCount,
  alwaysOpen = false,
  onDeleteComment, // <--- accept prop
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(alwaysOpen);
  const [posting, setPosting] = useState(false);
  const commentsRef = useRef<Comment[]>([]); // track last comments
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Load comments silently
  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, profiles (username, full_name, avatar_url)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const oldIds = commentsRef.current.map(c => c.id).join(',');
      const newIds = (data || []).map(c => c.id).join(',');
      if (oldIds !== newIds) {
        setComments(data || []);
        commentsRef.current = data || [];
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // --- Initial load
  useEffect(() => {
    if (alwaysOpen || showComments) loadComments();
  }, [postId, alwaysOpen, showComments]);

  // --- Polling for live comments
  useEffect(() => {
    if (!(alwaysOpen || showComments)) return;
    const interval = setInterval(() => loadComments(), 3000);
    return () => clearInterval(interval);
  }, [postId, alwaysOpen, showComments]);

  // --- Refresh when parent count changes
  useEffect(() => {
    if (alwaysOpen || showComments) loadComments();
  }, [commentsCount]);

  // --- Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content: newComment.trim() });

      if (error) throw error;

      setNewComment('');
      await loadComments();

      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  // --- Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteComment) {
      // Use the callback from SocialFeed if provided
      onDeleteComment(commentId);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Comment deleted successfully!",
      });

      await loadComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleComments = () => {
    if (!alwaysOpen) setShowComments(!showComments);
  };

  return (
    <div className="space-y-3">
      {/* Toggle button if not always open */}
      {!alwaysOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleComments}
          className="hover:bg-white/10 text-muted-foreground"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
        </Button>
      )}

      {/* Comments List */}
      {(showComments || alwaysOpen) && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          {/* Comment input */}
          <div className="flex gap-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="glass-input min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              onClick={handleAddComment}
              disabled={posting || !newComment.trim()}
              size="sm"
              className="bg-neon-blue hover:bg-neon-blue/80 text-black self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Comments */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => navigate(`/profile/view/${comment.user_id}`)}
                  >
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/view/${comment.user_id}`)}
                      >
                        {comment.profiles.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground">@{comment.profiles.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>

                  {/* Delete button for post owner */}
                  {(userId === postOwnerId || comment.user_id === userId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
