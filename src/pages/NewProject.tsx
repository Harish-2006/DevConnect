
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import { User } from '@supabase/supabase-js';
import { Upload, Image as ImageIcon, FileArchive } from 'lucide-react';

const NewProject = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        } else if (session) {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip'))) {
      setProjectFile(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid ZIP file",
        variant: "destructive",
      });
    }
  };

  const createProject = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project title",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      let imageUrl = null;
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Upload cover image if selected
      if (coverImage) {
        const imageExt = coverImage.name.split('.').pop();
        const imageName = `${user.id}-${Date.now()}.${imageExt}`;
        const { data: imageData, error: imageError } = await supabase.storage
          .from('project-files')
          .upload(`images/${imageName}`, coverImage);

        if (imageError) throw imageError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(`images/${imageName}`);
        
        imageUrl = publicUrl;
      }

      // Upload project file if selected
      if (projectFile) {
        const projectFileName = `${user.id}-${Date.now()}-${projectFile.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('project-files')
          .upload(`projects/${projectFileName}`, projectFile);

        if (fileError) throw fileError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(`projects/${projectFileName}`);
        
        fileUrl = publicUrl;
        fileName = projectFile.name;
        fileSize = projectFile.size;
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title,
          description,
          github_url: githubUrl || null,
          demo_url: demoUrl || null,
          image_url: imageUrl,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully!",
      });

      navigate('/projects');
    } catch (error: any) {
      console.error('Create project error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold neon-text mb-2">Create New Project</h1>
            <p className="text-muted-foreground">Share your project with the developer community</p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo">Demo URL</Label>
                  <Input
                    id="demo"
                    placeholder="https://your-demo.com"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="glass-button"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Select Image
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {coverImage && (
                      <span className="text-sm text-muted-foreground">{coverImage.name}</span>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Project Files (ZIP)</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="glass-button"
                    >
                      <FileArchive className="w-4 h-4 mr-2" />
                      Select ZIP File
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {projectFile && (
                      <span className="text-sm text-muted-foreground">
                        {projectFile.name} ({(projectFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your project files as a ZIP archive for others to download
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={createProject}
                  disabled={saving || !title.trim()}
                  className="bg-neon-blue hover:bg-neon-blue/80 text-black flex-1"
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/projects')}
                  className="glass-button"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewProject;
