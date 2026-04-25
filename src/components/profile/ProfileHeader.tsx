
import { Button } from "@/components/ui/button";
import { Settings, Save, X } from 'lucide-react';

interface ProfileHeaderProps {
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProfileHeader = ({ isEditing, saving, onEdit, onSave, onCancel }: ProfileHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold neon-text">Profile Settings</h1>
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button 
              onClick={onSave} 
              disabled={saving}
              className="bg-neon-green hover:bg-neon-green/80 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              onClick={onCancel} 
              variant="outline"
              className="glass-button"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <Button 
            onClick={onEdit}
            className="bg-neon-blue hover:bg-neon-blue/80 text-black"
          >
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
