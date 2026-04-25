
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfo from '@/components/profile/ProfileInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectsTab from '@/components/profile/ProjectsTab';
import NetworkTab from '@/components/profile/NetworkTab';
import SocialFeed from '@/components/SocialFeed';

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

interface FollowData {
  id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
  };
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
      await loadProfileData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        } else if (session) {
          setUser(session.user);
          loadProfileData(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfileData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setCurrentAvatarUrl(profileData.avatar_url);

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load followers
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(`
          id,
          profiles!follows_follower_id_fkey (
            id, username, full_name, avatar_url, bio
          )
        `)
        .eq('following_id', userId);

      if (followersError) throw followersError;
      setFollowers(followersData || []);

      // Load following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          id,
          profiles!follows_following_id_fkey (
            id, username, full_name, avatar_url, bio
          )
        `)
        .eq('follower_id', userId);

      if (followingError) throw followingError;
      setFollowing(followingData || []);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    if (user?.id) {
      loadProfileData(user.id);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      let updatedAvatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        updatedAvatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          avatar_url: updatedAvatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentAvatarUrl(updatedAvatarUrl);
      setIsEditing(false);
      setAvatarFile(null);

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCurrentAvatarUrl(previewUrl);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
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

  const handleUnfollowUser = async (followId: string, isFollower: boolean) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followId);

      if (error) throw error;

      if (isFollower) {
        setFollowers(followers.filter(f => f.id !== followId));
      } else {
        setFollowing(following.filter(f => f.id !== followId));
      }

      toast({
        title: "Success",
        description: isFollower ? "Follower removed!" : "Unfollowed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
        <div className="max-w-4xl mx-auto">
          <ProfileHeader 
            isEditing={isEditing}
            saving={saving}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          
          <div className="mt-8">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4 glass-card">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-6">
                <ProfileInfo 
                  profile={profile}
                  isEditing={isEditing}
                  currentAvatarUrl={currentAvatarUrl}
                  avatarFile={avatarFile}
                  onProfileChange={handleProfileChange}
                  onAvatarFileChange={handleAvatarFileChange}
                />
              </TabsContent>
              
              <TabsContent value="projects" className="mt-6">
                <ProjectsTab 
                  projects={projects}
                  onDeleteProject={handleDeleteProject}
                />
              </TabsContent>
              
              <TabsContent value="posts" className="mt-6">
                <SocialFeed 
                  userId={user?.id || ''} 
                  showCreatePost={false}
                  showEditOptions={true}
                />
              </TabsContent>
              
              <TabsContent value="network" className="mt-6">
                <NetworkTab 
                  followers={followers}
                  following={following}
                  onUnfollowUser={handleUnfollowUser}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
