import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Github, ExternalLink, Heart, Star, Users, Folder } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  github_url: string;
  demo_url: string;
  image_url: string;
  likes_count: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  project_likes: { user_id: string }[];
}

interface FollowingFeedProps {
  userId: string;
}

const FollowingFeed = ({ userId }: FollowingFeedProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [selectedProjectLikes, setSelectedProjectLikes] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFollowingProjects();
  }, [userId]);

  const loadFollowingProjects = async () => {
    try {
      // Get users that current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      const followingIds = followingData?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get projects from followed users
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          project_likes (user_id)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);
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

  const toggleLike = async (projectId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('project_likes')
          .insert({ project_id: projectId, user_id: userId });
      }
      await loadFollowingProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewProjectLikes = async (projectId: string) => {
    try {
      const { data: likesData, error } = await supabase
        .from('project_likes')
        .select(`
          user_id,
          profiles (username, full_name, avatar_url)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setSelectedProjectLikes(likesData || []);
      setShowLikesDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLikeClick = (project: Project, isLiked: boolean) => {
    const isOwner = project.profiles.username === userId; // Assuming you're comparing usernames
    
    if (isOwner && project.likes_count > 0) {
      viewProjectLikes(project.id);
    } else {
      toggleLike(project.id, isLiked);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-white/10 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-12 text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground">
            Follow some developers to see their latest projects here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-neon-blue" />
        <h2 className="text-xl font-semibold">Projects from Developers You Follow</h2>
      </div>
      
      {projects.map((project) => {
        const isLiked = project.project_likes.some(like => like.user_id === userId);
        
        return (
          <Card 
            key={project.id} 
            className="glass-card hover:bg-white/5 transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={project.profiles.avatar_url} />
                  <AvatarFallback>
                    {project.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{project.profiles.full_name}</h4>
                  <p className="text-sm text-muted-foreground">@{project.profiles.username}</p>
                </div>
              </div>
              
              <CardTitle className="text-neon-blue">{project.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {project.image_url && (
                <div className="w-full">
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full h-auto max-h-64 object-contain rounded-lg bg-black/5"
                  />
                </div>
              )}
              
              <p className="text-muted-foreground">{project.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex gap-2">
                  {project.github_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.github_url, '_blank');
                      }}
                    >
                      <Github className="w-3 h-3 mr-1" />
                      Code
                    </Button>
                  )}
                  
                  {project.demo_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.demo_url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Demo
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeClick(project, isLiked);
                  }}
                  className={`hover:bg-white/10 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {project.likes_count}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Likes Dialog */}
      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Liked by</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {selectedProjectLikes.map((like) => (
              <div key={like.user_id} className="flex items-center space-x-3">
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
    </div>
  );
};

export default FollowingFeed;
