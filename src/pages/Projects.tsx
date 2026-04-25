import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import { User } from '@supabase/supabase-js';
import { Github, ExternalLink, Heart, Plus, Download, Trash2 } from 'lucide-react';

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
  };
  project_likes: { user_id: string }[];
}

const Projects = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      await loadProjects(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        } else if (session) {
          setUser(session.user);
          loadProjects(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (username, full_name),
          project_likes (user_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onSignOut={handleSignOut} />
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold neon-text mb-2">My Projects</h1>
              <p className="text-muted-foreground">Manage and showcase your work</p>
            </div>
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start showcasing your work!
                </p>
                <Button
                  onClick={() => navigate('/projects/new')}
                  className="bg-neon-blue hover:bg-neon-blue/80 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="glass-card hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="relative">
                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-48 object-contain rounded-t-lg bg-black/5"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {project.file_url && project.file_name && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-button h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectDownload(project.file_url!, project.file_name!);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-button h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="neon-text">{project.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        {project.likes_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
