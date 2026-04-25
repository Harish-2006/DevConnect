import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import { User } from '@supabase/supabase-js';
import { Github, ExternalLink, Heart, Download, ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  github_url: string;
  demo_url: string;
  image_url: string;
  file_url?: string;
  file_name?: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  project_likes: { user_id: string }[];
}

interface ProjectLike {
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [projectLikes, setProjectLikes] = useState<ProjectLike[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      await loadProject();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          project_likes (user_id)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !project) return;

    const isLiked = project.project_likes.some(like => like.user_id === user.id);

    try {
      if (isLiked) {
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', project.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('project_likes')
          .insert({ project_id: project.id, user_id: user.id });
      }
      await loadProject();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewProjectLikes = async () => {
    if (!project) return;

    try {
      const { data: likesData, error } = await supabase
        .from('project_likes')
        .select(`
          user_id,
          profiles (username, full_name, avatar_url)
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setProjectLikes(likesData || []);
      setShowLikesDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLikeClick = () => {
    if (!user || !project) return;

    const isOwner = project.user_id === user.id;
    
    if (isOwner && project.likes_count > 0) {
      viewProjectLikes();
    } else {
      toggleLike();
    }
  };

  const handleDownload = async () => {
    if (!project?.file_url || !project?.file_name) return;

    try {
      const response = await fetch(project.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = project.file_name;
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} onSignOut={handleSignOut} />
        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Project not found</h1>
            <Button onClick={() => navigate('/explore')}>
              Back to Explore
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = user && project.project_likes.some(like => like.user_id === user.id);
  const isOwner = user && project.user_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onSignOut={handleSignOut} />
      
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={project.profiles.avatar_url} />
                  <AvatarFallback>
                    {project.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{project.profiles.full_name}</h3>
                  <p className="text-sm text-muted-foreground">@{project.profiles.username}</p>
                </div>
              </div>
              
              <CardTitle className="text-3xl neon-text">{project.title}</CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {project.likes_count} likes
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {project.image_url && (
                <div className="w-full">
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full h-auto max-h-96 object-contain rounded-lg bg-black/5"
                  />
                </div>
              )}
              
              <div>
                <h4 className="text-lg font-semibold mb-3">Project Description</h4>
                {project.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No details available for this project.
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                {project.github_url && (
                  <Button
                    variant="outline"
                    className="glass-button"
                    onClick={() => window.open(project.github_url, '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View Code
                  </Button>
                )}
                
                {project.demo_url && (
                  <Button
                    variant="outline"
                    className="glass-button"
                    onClick={() => window.open(project.demo_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Live Demo
                  </Button>
                )}
                
                {project.file_url && project.file_name && (
                  <Button
                    variant="outline"
                    className="glass-button"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Project
                  </Button>
                )}
                
                {user && (
                  <Button
                    variant="outline"
                    className={`glass-button ${isLiked ? 'text-red-500 border-red-500/30' : ''}`}
                    onClick={handleLikeClick}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Likes Dialog */}
          <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Liked by</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {projectLikes.map((like) => (
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
      </div>
    </div>
  );
};

export default ProjectDetails;
