
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Home, Users, FolderOpen, Plus, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import NotificationCenter from './NotificationCenter';

interface NavigationProps {
  user: SupabaseUser | null;
  onSignOut: () => void;
}

interface UserProfile {
  avatar_url: string | null;
  full_name: string | null;
  username: string;
}

const Navigation = ({ user, onSignOut }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: User, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/projects/new', icon: Plus, label: 'New Project' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/following', icon: Users, label: 'Following' },
  ];

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, username')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0" 
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">DC</span>
            </div>
            <span className="text-xl font-bold neon-text hidden sm:block">DevConnect</span>
          </div>

          {/* Navigation Items - Desktop */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1 flex-shrink-0">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={location.pathname === item.path ? 
                    "bg-neon-blue hover:bg-neon-blue/80 text-black" : 
                    "glass-button"
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {user ? (
              <>
                <NotificationCenter userId={user.id} />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={userProfile?.avatar_url || "/placeholder.svg"} 
                          alt="Profile" 
                        />
                        <AvatarFallback className="bg-neon-blue text-black">
                          {userProfile?.full_name?.charAt(0)?.toUpperCase() || 
                           userProfile?.username?.charAt(0)?.toUpperCase() ||
                           user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  className="glass-button text-sm"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-neon-blue hover:bg-neon-blue/80 text-black text-sm"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="lg:hidden pb-3 pt-2">
            <div className="flex items-center space-x-1 overflow-x-auto pb-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`whitespace-nowrap flex-shrink-0 ${location.pathname === item.path ? 
                    "bg-neon-blue hover:bg-neon-blue/80 text-black" : 
                    "glass-button"
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
