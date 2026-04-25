
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import { lazy, Suspense } from 'react';


const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const SocialHomeFeed = lazy(() => import('@/components/SocialHomeFeed'));


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
        
        // Redirect to home page when user logs in
        if (event === 'SIGNED_IN' && session?.user) {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  // Show social feed for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} onSignOut={handleSignOut} />
        <div className="pt-16">
          <Suspense fallback={<div className="text-center mt-10">Loading posts...</div>}>
  <SocialHomeFeed user={user} />
</Suspense>

        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="pt-16">
        <Hero />
        
        {/* Call to Action Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute inset-0 gradient-bg opacity-30"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to <span className="neon-text">Connect</span>?
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of developers who are already building their network, 
                  showcasing their work, and collaborating on amazing projects.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    size="lg" 
                    className="bg-neon-blue hover:bg-neon-blue/80 text-black font-semibold"
                    onClick={() => navigate('/auth')}
                  >
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="glass-button"
                    onClick={() => navigate('/auth')}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
