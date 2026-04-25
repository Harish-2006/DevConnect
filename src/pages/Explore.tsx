
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import { Search, Users, MapPin, Globe, Github, Linkedin, UserPlus, UserCheck } from 'lucide-react';

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

interface TechStack {
  id: string;
  name: string;
  category: string;
}

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [techStackFilter, setTechStackFilter] = useState('all');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
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
      await loadProfilesAndTechStacks();
      await loadFollowingIds(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        } else if (session) {
          setUser(session.user);
          loadProfilesAndTechStacks();
          loadFollowingIds(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadFollowingIds = async (userId: string) => {
    try {
      const { data: followingData, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      
      const ids = followingData?.map(f => f.following_id) || [];
      setFollowingIds(ids);
    } catch (error: any) {
      console.error('Error loading following:', error);
    }
  };

  const loadProfilesAndTechStacks = async () => {
    setLoading(true);
    try {
      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);
      setFilteredProfiles(profilesData || []);

      // Load tech stacks
      const { data: techStacksData, error: techStacksError } = await supabase
        .from('tech_stacks')
        .select('*')
        .order('name', { ascending: true });

      if (techStacksError) throw techStacksError;
      setTechStacks(techStacksData || []);

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

  useEffect(() => {
    let results = profiles;

    // Filter out the current user
    if (user) {
      results = results.filter(profile => profile.id !== user.id);
    }

    if (searchTerm) {
      results = results.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter && locationFilter !== 'all') {
      results = results.filter(profile =>
        profile.location?.toLowerCase() === locationFilter.toLowerCase()
      );
    }

    setFilteredProfiles(results);
  }, [searchTerm, locationFilter, techStackFilter, profiles, user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
  };

  const handleTechStackFilterChange = (value: string) => {
    setTechStackFilter(value);
  };

  const handleFollowUser = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: profileId,
        });

      if (error) throw error;

      setFollowingIds(prev => [...prev, profileId]);
      toast({
        title: "Success",
        description: "Successfully followed user!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnfollowUser = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);

      if (error) throw error;

      setFollowingIds(prev => prev.filter(id => id !== profileId));
      toast({
        title: "Success",
        description: "Successfully unfollowed user!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/profile/view/${profileId}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isFollowing = (profileId: string) => {
    return followingIds.includes(profileId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onSignOut={handleSignOut} />

      <div className="container mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold neon-text">Explore Profiles</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search by name, bio, or username..."
            className="glass-input"
            value={searchTerm}
            onChange={handleSearch}
          />

          <Select onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="glass-button w-full">
              <SelectValue placeholder="Filter by Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {[...new Set(profiles.map(profile => profile.location).filter(Boolean))].map(location => (
                <SelectItem key={location} value={location as string}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleTechStackFilterChange}>
            <SelectTrigger className="glass-button w-full">
              <SelectValue placeholder="Filter by Tech Stack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tech Stacks</SelectItem>
              {techStacks.map(tech => (
                <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <Card key={profile.id} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 mr-1 text-neon-blue" />
                  {profile.full_name || 'No Name'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
                    <AvatarFallback className="bg-gradient-to-br from-neon-blue to-neon-purple text-black font-bold text-lg">
                      {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">@{profile.username}</p>
                    {profile.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio || 'No bio available.'}</p>
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
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    className="bg-neon-blue hover:bg-neon-blue/80 text-black"
                    onClick={() => handleViewProfile(profile.id)}
                  >
                    View Profile
                  </Button>
                  {isFollowing(profile.id) ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-button"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Following
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unfollow User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unfollow {profile.full_name || profile.username}? You will no longer see their updates in your feed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleUnfollowUser(profile.id)}
                          >
                            Unfollow
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button"
                      onClick={() => handleFollowUser(profile.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Follow
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
