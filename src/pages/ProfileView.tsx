
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import { MapPin, Globe, Github, Linkedin, Users, UserPlus, UserCheck, Heart, MessageSquare, Share, ExternalLink } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  website: string;
}

interface Post {
  id: string;
  content: string;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  github_url: string;
  demo_url: string;
  image_url: string;
  likes_count: number;
  created_at: string;
}

const ProfileView = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
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
      if (userId) {
        await loadProfileData(userId, session.user.id);
      }
    };

    checkAuth();
  }, [userId, navigate]);

  const loadProfileData = async (profileUserId: string, currentUserId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load followers count
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', profileUserId);

      if (followersError) throw followersError;
      setFollowersCount(followersData?.length || 0);

      // Load following count
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', profileUserId);

      if (followingError) throw followingError;
      setFollowingCount(followingData?.length || 0);

      // Check if current user follows this profile
      if (currentUserId !== profileUserId) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', profileUserId)
          .single();

        if (followError && followError.code !== 'PGRST116') throw followError;
        setIsFollowing(!!followData);
      }

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

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }

      toast({
        title: "Success",
        description: isFollowing ? "Unfollowed successfully!" : "Followed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else if (diffInHours >= 1) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInMinutes}m ago`;
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
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} onSignOut={handleSignOut} />
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onSignOut={handleSignOut} />
      
      <div className="max-w-6xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Header */}
        <Card className="glass-card mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
                <AvatarFallback className="bg-gradient-to-br from-neon-blue to-neon-purple text-black font-bold text-2xl">
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.full_name || 'No Name'}</h1>
                    <p className="text-lg text-muted-foreground mb-2">@{profile.username}</p>
                    {profile.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                  
                  {user?.id !== userId && (
                    <Button
                      onClick={handleFollow}
                      className={isFollowing ? "glass-button" : "bg-neon-blue hover:bg-neon-blue/80 text-black"}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{followersCount}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{followingCount}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{posts.length}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{projects.length}</div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profile.website && (
                    <Badge variant="outline" className="glass-button cursor-pointer" onClick={() => window.open(profile.website, '_blank')}>
                      <Globe className="w-3 h-3 mr-1" />
                      Website
                    </Badge>
                  )}
                  {profile.github_url && (
                    <Badge variant="outline" className="glass-button cursor-pointer" onClick={() => window.open(profile.github_url, '_blank')}>
                      <Github className="w-3 h-3 mr-1" />
                      GitHub
                    </Badge>
                  )}
                  {profile.linkedin_url && (
                    <Badge variant="outline" className="glass-button cursor-pointer" onClick={() => window.open(profile.linkedin_url, '_blank')}>
                      <Linkedin className="w-3 h-3 mr-1" />
                      LinkedIn
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Posts and Projects */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {posts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">This user hasn't shared any posts.</p>
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <Card key={post.id} className="glass-card">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {getTimeAgo(post.created_at)}
                      </div>
                    </div>
                    
                    {post.content && (
                      <p className="text-foreground">{post.content}</p>
                    )}
                    
                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden">
                        {post.media_type === 'image' && (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full max-h-96 object-cover rounded-lg"
                          />
                        )}
                        {post.media_type === 'video' && (
                          <video controls className="w-full max-h-96 rounded-lg">
                            <source src={post.media_url} />
                          </video>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {projects.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <ExternalLink className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground">This user hasn't shared any projects.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                  <Card key={project.id} className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-neon-blue">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {project.image_url && (
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      
                      <p className="text-muted-foreground">{project.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="w-4 h-4" />
                          {project.likes_count}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTimeAgo(project.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {project.github_url && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="glass-button"
                            onClick={() => window.open(project.github_url, '_blank')}
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
                            onClick={() => window.open(project.demo_url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Demo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileView;
