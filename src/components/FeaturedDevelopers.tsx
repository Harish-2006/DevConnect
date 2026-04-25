
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Github, Users, Star, MapPin } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Developer = Tables<'profiles'> & {
  follower_count?: number;
  project_count?: number;
  tech_skills?: string[];
};

const FeaturedDevelopers = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch profiles with basic info, excluding the current user
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('status', 'active')
          .neq('id', user?.id || '') // Filter out current user
          .limit(6);

        if (error) {
          console.error('Error fetching developers:', error);
          return;
        }

        if (profiles) {
          // Enhance profiles with additional data
          const enhancedProfiles = await Promise.all(
            profiles.map(async (profile) => {
              // Get follower count
              const { count: followerCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profile.id);

              // Get project count
              const { count: projectCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

              // Get tech skills
              const { data: userTechStacks } = await supabase
                .from('user_tech_stacks')
                .select(`
                  tech_stacks (
                    name
                  )
                `)
                .eq('user_id', profile.id)
                .limit(4);

              const techSkills = userTechStacks?.map(
                (uts: any) => uts.tech_stacks?.name
              ).filter(Boolean) || [];

              return {
                ...profile,
                follower_count: followerCount || 0,
                project_count: projectCount || 0,
                tech_skills: techSkills
              };
            })
          );

          setDevelopers(enhancedProfiles);
        }
      } catch (error) {
        console.error('Error fetching developers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Meet Our <span className="neon-text">Featured Developers</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover talented developers from around the world. Connect, collaborate, and learn from the best.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="glass-card animate-pulse">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-6 w-16 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Meet Our <span className="neon-text">Featured Developers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover talented developers from around the world. Connect, collaborate, and learn from the best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {developers.map((developer) => (
            <Card key={developer.id} className="glass-card group hover:neon-border transition-all duration-300 overflow-hidden h-[400px] flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16 border-2 border-neon-blue/30">
                    <AvatarImage src={developer.avatar_url || ''} alt={developer.full_name || developer.username} />
                    <AvatarFallback className="bg-gradient-to-br from-neon-blue to-neon-purple text-black font-bold">
                      {(developer.full_name || developer.username).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{developer.full_name || developer.username}</h3>
                    <p className="text-neon-blue font-medium truncate">@{developer.username}</p>
                    {developer.location && (
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{developer.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-shrink-0">
                  {developer.bio || "Building amazing projects and connecting with fellow developers."}
                </p>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="min-h-[32px] flex items-start">
                    {developer.tech_skills && developer.tech_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {developer.tech_skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No tech skills listed</div>
                    )}
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-neon-blue" />
                        <span>{developer.follower_count} followers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-neon-green" />
                        <span>{developer.project_count} projects</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-neon-blue hover:bg-neon-blue/80 text-black">
                        Connect
                      </Button>
                      {developer.github_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="glass-button"
                          onClick={() => window.open(developer.github_url, '_blank')}
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {developers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No developers found. Be the first to join our community!</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button variant="outline" className="glass-button text-lg px-8 py-3">
            View All Developers
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDevelopers;
