
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, MessageSquare, AlertTriangle, Ban, Trash2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  full_name: string;
  status: string;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is admin (replace with your admin email)
      const adminEmail = 'your-admin-email@example.com';
      
      if (session.user.email === adminEmail) {
        setIsAdmin(true);
        await loadData();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUserAction = async (userId: string, action: 'warn' | 'restrict' | 'suspend', reason: string, duration?: number) => {
    try {
      // Record admin action
      const { error: actionError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          target_user_id: userId,
          action_type: action,
          reason,
          duration_hours: duration
        });

      if (actionError) throw actionError;

      // Update user status if restricting or suspending
      if (action === 'restrict' || action === 'suspend') {
        const newStatus = action === 'restrict' ? 'inactive' : 'suspended';
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: `User ${action}ed successfully.`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully.",
      });

      await loadData();
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
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold neon-text mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and content on the platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-blue" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="glass-card p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button"
                      onClick={() => handleUserAction(user.id, 'warn', 'Admin warning')}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Warn
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button"
                      onClick={() => handleUserAction(user.id, 'restrict', 'Temporary restriction', 24)}
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      Restrict
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUserAction(user.id, 'suspend', 'Account suspended')}
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Posts Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-neon-green" />
                Post Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {posts.map((post) => (
                <div key={post.id} className="glass-card p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{post.profiles.full_name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">@{post.profiles.username}</p>
                      <p className="text-sm">{post.content?.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
