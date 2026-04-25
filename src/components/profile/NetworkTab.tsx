
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';

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

interface NetworkTabProps {
  followers: FollowData[];
  following: FollowData[];
  onUnfollowUser: (followId: string, isFollower: boolean) => void;
}

const NetworkTab = ({ followers, following, onUnfollowUser }: NetworkTabProps) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    navigate(`/profile/view/${userId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Followers */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Followers ({followers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {followers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No followers yet</p>
          ) : (
            followers.map((follow) => (
              <div key={follow.id} className="flex items-center justify-between glass-card p-3 rounded-lg">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                  onClick={() => handleUserClick(follow.profiles.id)}
                >
                  <Avatar>
                    <AvatarImage src={follow.profiles.avatar_url} />
                    <AvatarFallback>
                      {follow.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follow.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{follow.profiles.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="glass-button"
                  onClick={() => onUnfollowUser(follow.id, true)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Following */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Following ({following.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {following.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Not following anyone yet</p>
          ) : (
            following.map((follow) => (
              <div key={follow.id} className="flex items-center justify-between glass-card p-3 rounded-lg">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                  onClick={() => handleUserClick(follow.profiles.id)}
                >
                  <Avatar>
                    <AvatarImage src={follow.profiles.avatar_url} />
                    <AvatarFallback>
                      {follow.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follow.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{follow.profiles.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="glass-button"
                  onClick={() => onUnfollowUser(follow.id, false)}
                >
                  Unfollow
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTab;
