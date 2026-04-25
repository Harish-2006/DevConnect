
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Upload } from 'lucide-react';

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

interface ProfileInfoProps {
  profile: Profile | null;
  isEditing: boolean;
  currentAvatarUrl: string | null;
  avatarFile: File | null;
  onProfileChange: (updatedProfile: Profile) => void;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileInfo = ({ 
  profile, 
  isEditing, 
  currentAvatarUrl, 
  avatarFile, 
  onProfileChange, 
  onAvatarFileChange 
}: ProfileInfoProps) => {
  if (!profile) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-blue" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarImage 
              src={currentAvatarUrl} 
              alt={profile?.username}
              key={currentAvatarUrl}
            />
            <AvatarFallback className="bg-gradient-to-br from-neon-blue to-neon-purple text-black font-bold text-lg">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
            <p className="text-muted-foreground">@{profile?.username}</p>
            {isEditing && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="glass-button"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Change Avatar
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={onAvatarFileChange}
                  className="hidden"
                />
                {avatarFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {avatarFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile?.username || ''}
              onChange={(e) => onProfileChange({...profile, username: e.target.value})}
              disabled={!isEditing}
              className="glass-input"
            />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile?.full_name || ''}
              onChange={(e) => onProfileChange({...profile, full_name: e.target.value})}
              disabled={!isEditing}
              className="glass-input"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profile?.location || ''}
              onChange={(e) => onProfileChange({...profile, location: e.target.value})}
              disabled={!isEditing}
              className="glass-input"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profile?.website || ''}
              onChange={(e) => onProfileChange({...profile, website: e.target.value})}
              disabled={!isEditing}
              className="glass-input"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile?.bio || ''}
            onChange={(e) => onProfileChange({...profile, bio: e.target.value})}
            disabled={!isEditing}
            rows={4}
            className="glass-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              value={profile?.github_url || ''}
              onChange={(e) => onProfileChange({...profile, github_url: e.target.value})}
              disabled={!isEditing}
              placeholder="https://github.com/yourusername"
              className="glass-input"
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={profile?.linkedin_url || ''}
              onChange={(e) => onProfileChange({...profile, linkedin_url: e.target.value})}
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/yourusername"
              className="glass-input"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;
