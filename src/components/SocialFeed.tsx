import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageSquare, Share, Github, ExternalLink, User, Image, Video, Users, MoreHorizontal, Trash2, Download, MessageCircleOff, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';


interface Post {
  id: string;
  content: string;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  comments_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id?: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  projects?: {
    title: string;
    description: string;
    github_url: string;
    demo_url: string;
    image_url: string;
    file_url?: string;
    file_name?: string;
  };
  post_likes: { user_id: string }[];
}

interface SocialFeedProps {
  userId: string;
  showCreatePost?: boolean;
  showEditOptions?: boolean;
  hideCommentSection?: boolean;

}

const SocialFeed = ({ userId, showCreatePost = true, showEditOptions = false, hideCommentSection = false }: SocialFeedProps) => {
  const [posts, setPosts] = useState([]);
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const [newPost, setNewPost] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const CommentSection = lazy(() => import('./CommentSection'));
  const ImageCropDialog = lazy(() => import('./ImageCropDialog'));
  const PostPreviewDialog = lazy(() => import('./PostPreviewDialog'));
  const navigate = useNavigate();
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [selectedPostLikes, setSelectedPostLikes] = useState<any[]>([]);
  const [likesPostId, setLikesPostId] = useState<string | null>(null);

useEffect(() => {
  loadFeed(); // Load all posts once on mount
}, [userId]);

// Live updater effect for likes/comments
useEffect(() => {
  const interval = setInterval(() => {
    refreshLikes();
  }, 4000);
  return () => clearInterval(interval);
}, [userId]);

useEffect(() => {
  if (!showLikesDialog || !likesPostId) return;

  const fetchLikes = async () => {
    try {
      const { data: likesData, error } = await supabase
        .from('post_likes')
        .select(`
          user_id,
          profiles (username, full_name, avatar_url)
        `)
        .eq('post_id', likesPostId);

      if (!error) setSelectedPostLikes(likesData || []);
    } catch (err) {
      console.error('Error fetching likes dialog', err);
    }
  };

  // Initial fetch
  fetchLikes();

  // Poll every 2–3 seconds
  const interval = setInterval(fetchLikes, 3000);

  return () => clearInterval(interval);
}, [showLikesDialog, likesPostId]);


  const loadFeed = async () => {
    try {
      let userIds: string[];

      if (showEditOptions) {
        userIds = [userId];
      } else {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        const followingIds = followingData?.map(f => f.following_id) || [];
        userIds = [...followingIds, userId];
      }

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          projects (title, description, github_url, demo_url, image_url, file_url, file_name),
          post_likes (user_id),
          comments (id)
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Compute likes_count and comments_count
      const updatedPosts = (postsData || []).map(post => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.comments?.length || 0,
      }));

      setPosts(updatedPosts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const refreshLikes = async () => {
    try {
      const postIds = postsRef.current.map(p => p.id);
      if (!postIds.length) return;

      const { data: updatedData, error } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      if (error) throw error;

      // map postId -> likes_count
      const likesMap = new Map<string, number>();
      updatedData.forEach(like => {
        likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
      });

      let changed = false;
      const newPosts = postsRef.current.map(post => {
        const newLikes = likesMap.get(post.id) || 0;
        if (newLikes !== post.likes_count) {
          changed = true;
          return { ...post, likes_count: newLikes };
        }
        return post;
      });

      if (changed) setPosts(newPosts);
    } catch (err) {
      console.error("Error refreshing likes", err);
    }
  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    } else if (file && file.type.startsWith('video/')) {
      setSelectedMedia(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setSelectedMedia(croppedFile);
    setImagePreview(null);
    setOriginalFile(null);
  };

  const handlePreviewPost = () => {
    if (!newPost.trim() && !selectedMedia) return;
    setShowPreviewDialog(true);
  };

  const createPost = async () => {
    if (!newPost.trim() && !selectedMedia) return;

    console.log('Creating post with userId:', userId);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    if (!session || !session.user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive",
      });
      return;
    }

    const authenticatedUserId = session.user.id;
    console.log('Authenticated user ID:', authenticatedUserId);

    setPosting(true);
    try {
      let mediaUrl = null;
      let mediaType: 'text' | 'image' | 'video' = 'text';

      if (selectedMedia) {
        const fileExt = selectedMedia.name.split('.').pop();
        const fileName = `${authenticatedUserId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, selectedMedia);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        mediaUrl = publicUrl;
        
        if (selectedMedia.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (selectedMedia.type.startsWith('video/')) {
          mediaType = 'video';
        }
      }

      console.log('Inserting post with data:', {
        user_id: authenticatedUserId,
        content: newPost,
        media_url: mediaUrl,
        media_type: mediaType,
        comments_enabled: commentsEnabled
      });

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: authenticatedUserId,
          content: newPost,
          media_url: mediaUrl,
          media_type: mediaType,
          comments_enabled: commentsEnabled
        });

      if (error) {
        console.error('Post creation error:', error);
        throw error;
      }

      setNewPost('');
      setSelectedMedia(null);
      setCommentsEnabled(true);
      setShowPreviewDialog(false);
      await loadFeed();
      
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    } catch (error: any) {
      console.error('Create post error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadFeed();
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
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
      }
      await loadFeed();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewPostLikes = async (postId: string) => {
    try {
      setLikesPostId(postId); // set the active post for dialog polling
      setShowLikesDialog(true); // open dialog

      const { data: likesData, error } = await supabase
        .from('post_likes')
        .select(`
          user_id,
          profiles (username, full_name, avatar_url)
        `)
        .eq('post_id', postId);

      if (error) throw error;

      setSelectedPostLikes(likesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleShare = async (post: Post) => {
    try {
      const shareData = {
        title: `Check out this post by ${post.profiles.full_name}`,
        text: post.content || 'Check out this post!',
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Success",
          description: "Post URL copied to clipboard!",
        });
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
  if (!window.confirm('Are you sure you want to delete this comment?')) return;

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // optional: only allow comment owner to delete their own comments

    if (error) throw error;

    toast({
      title: "Success",
      description: "Comment deleted successfully!",
    });

    // Refresh posts to update comments count
    await loadFeed();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};


  const handleProjectDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Project download started!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download project",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInHours >= 24) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else if (diffInHours >= 1) {
      return `${diffInHours}h`;
    } else {
      return `${diffInMinutes}m`;
    }
  };

  const getImageStyle = (mediaType: string) => {
    let aspectRatio = '1 / 1';
    let maxHeight = '540px';
    
    return {
      aspectRatio,
      maxHeight,
      width: '100%',
      objectFit: 'cover' as const
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-white/10 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post - Only show if showCreatePost is true */}
      {showCreatePost && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="glass-input min-h-[100px]"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-button"
                    onClick={() => document.getElementById('media-upload')?.click()}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Add Image/Video
                  </Button>
                  <input
                    id="media-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="comments-enabled"
                      checked={commentsEnabled}
                      onCheckedChange={setCommentsEnabled}
                    />
                    <Label htmlFor="comments-enabled" className="text-sm">
                      Allow comments
                    </Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviewPost}
                    disabled={!newPost.trim() && !selectedMedia}
                    className="glass-button"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={createPost}
                    disabled={posting || (!newPost.trim() && !selectedMedia)}
                    className="bg-neon-blue hover:bg-neon-blue/80 text-black"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
              
              {selectedMedia && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedMedia.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Crop Dialog */}
      <Suspense>
        <ImageCropDialog
          showCropDialog={showCropDialog}
          imagePreview={imagePreview}
          onShowCropDialogChange={setShowCropDialog}
          onCropComplete={handleCropComplete}
          originalFile={originalFile}
        />
      </Suspense>

      {/* Post Preview Dialog */}
      <Suspense>
        <PostPreviewDialog
          showPreviewDialog={showPreviewDialog}
          onShowPreviewDialogChange={setShowPreviewDialog}
          content={newPost}
          mediaFile={selectedMedia}
          commentsEnabled={commentsEnabled}
          onConfirmPost={createPost}
          posting={posting}
        />
      </Suspense>

      {/* Likes Dialog */}
      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Liked by</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {selectedPostLikes.map((like) => (
              <div 
                key={like.user_id} 
                className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-1 rounded"
                onClick={() => navigate(`/profile/view/${like.user_id}`)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={like.profiles?.avatar_url} />
                  <AvatarFallback>
                    {like.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{like.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{like.profiles?.username}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              Follow some developers or create your first post to see content here.
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => {
          const isLiked = post.post_likes.some(like => like.user_id === userId);
          const isOwner = post.user_id === userId;
          
          return (
            <div key={post.id} className="w-full">
              {/* Post Content - Full width when comments are hidden */}
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.profiles.avatar_url} />
                        <AvatarFallback>
                          {post.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{post.profiles.full_name}</h4>
                        <p className="text-sm text-muted-foreground">@{post.profiles.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(post.created_at)}
                          {post.updated_at !== post.created_at && ' • edited'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Post Actions Menu - Only show for post owner and in dashboard */}
                    {isOwner && showEditOptions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card">
                          <DropdownMenuItem 
                            onClick={() => deletePost(post.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {post.content && (
                    <p className="text-foreground">{post.content}</p>
                  )}
                  
                  {post.media_url && (
                    <div className="rounded-lg overflow-hidden">
                      {post.media_type === 'image' && (
                        <img 
                          src={post.media_url} 
                          alt="Post media" 
                          className="w-full h-auto max-h-96 object-contain rounded-lg bg-black/5"
                          loading="lazy"
                        />
                      )}
                      {post.media_type === 'video' && (
                        <video controls className="w-full max-h-96 rounded-lg">
                          <source src={post.media_url} />
                        </video>
                      )}
                    </div>
                  )}
                  
                  {post.projects && (
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {post.projects.image_url && (
                            <img 
                              src={post.projects.image_url} 
                              alt={post.projects.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h5 className="font-semibold text-neon-blue">{post.projects.title}</h5>
                            <p className="text-sm text-muted-foreground">{post.projects.description}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {post.projects.github_url && (
                                <Button size="sm" variant="outline" className="glass-button">
                                  <Github className="w-3 h-3 mr-1" />
                                  Code
                                </Button>
                              )}
                              {post.projects.demo_url && (
                                <Button size="sm" variant="outline" className="glass-button">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Demo
                                </Button>
                              )}
                              {post.projects.file_url && post.projects.file_name && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="glass-button"
                                  onClick={() => handleProjectDownload(post.projects!.file_url!, post.projects!.file_name!)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        {/* Toggle Like Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(post.id, isLiked)}
                          className={`hover:bg-white/10 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>

                        {/* View Likes Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewPostLikes(post.id)}
                          className="hover:bg-white/10 text-muted-foreground"
                        >
                          <Users className="w-4 h-4 mr-1" /> View Likes
                        </Button>
                      </div>
                    ) : (
                      // Regular users only see toggle like
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id, isLiked)}
                        className={`hover:bg-white/10 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                        {post.likes_count}
                      </Button>
                    )}

                    {/* Comments & Share */}
                    {!hideCommentSection && post.comments_enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-white/10 text-muted-foreground flex items-center gap-1"
                        onClick={() =>
                          setOpenCommentsPostId(
                            openCommentsPostId === post.id ? null : post.id
                          )
                        }
                      >
                        <MessageSquare className="w-4 h-4" />
                        {post.comments_count}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-white/10 text-muted-foreground"
                      onClick={() => handleShare(post)}
                    >
                      <Share className="w-4 h-4 mr-2" />
                    </Button>
                  </div>


                  {/* Comments Section - Only show if not hidden and comments enabled */}
                  {!hideCommentSection && post.comments_enabled && openCommentsPostId === post.id && (
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading comments...</div>}>
                      <CommentSection 
                        postId={post.id}
                        userId={userId}
                        commentsCount={post.comments_count}
                        alwaysOpen={true}
                        postOwnerId={post.user_id}
                        onDeleteComment={deleteComment}                     />
                    </Suspense>
                  )}


                </CardContent>
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
};

export default SocialFeed;
