
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircleOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface PostPreviewDialogProps {
  showPreviewDialog: boolean;
  onShowPreviewDialogChange: (open: boolean) => void;
  content: string;
  mediaFile: File | null;
  commentsEnabled: boolean;
  onConfirmPost: () => void;
  posting: boolean;
}

const PostPreviewDialog = ({
  showPreviewDialog,
  onShowPreviewDialogChange,
  content,
  mediaFile,
  commentsEnabled,
  onConfirmPost,
  posting
}: PostPreviewDialogProps) => {
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(mediaFile);
    } else {
      setMediaPreview(null);
    }
  }, [mediaFile]);

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      }
    };

    if (showPreviewDialog) {
      loadUserProfile();
    }
  }, [showPreviewDialog]);

  const getTimeAgo = () => {
    return 'now';
  };

  return (
    <Dialog open={showPreviewDialog} onOpenChange={onShowPreviewDialogChange}>
      <DialogContent className="max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle>Preview Your Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Preview */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{userProfile?.full_name || 'Your Name'}</h4>
                  <p className="text-sm text-muted-foreground">@{userProfile?.username || 'username'}</p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo()}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {content && (
                <p className="text-foreground">{content}</p>
              )}
              
              {mediaPreview && (
                <div className="rounded-lg overflow-hidden">
                  {mediaFile?.type.startsWith('image/') && (
                    <img 
                      src={mediaPreview} 
                      alt="Post preview" 
                      className="w-full h-auto max-h-96 object-contain rounded-lg bg-black/5"
                    />
                  )}
                  {mediaFile?.type.startsWith('video/') && (
                    <video controls className="w-full max-h-96 rounded-lg">
                      <source src={mediaPreview} />
                    </video>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-6 pt-2 border-t border-white/10">
                <div className="flex items-center text-muted-foreground text-sm">
                  <span>❤️ 0</span>
                </div>
                
                {commentsEnabled ? (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <span>💬 0</span>
                  </div>
                ) : (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MessageCircleOff className="w-4 h-4 mr-2" />
                    Comments disabled
                  </div>
                )}
                
                <div className="flex items-center text-muted-foreground text-sm">
                  <span>🔗 Share</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onShowPreviewDialogChange(false)}
              className="glass-button"
            >
              Edit Post
            </Button>
            <Button
              onClick={onConfirmPost}
              disabled={posting}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black"
            >
              {posting ? 'Posting...' : 'Confirm & Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostPreviewDialog;
