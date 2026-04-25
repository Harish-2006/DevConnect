
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from 'lucide-react';

interface TechStack {
  id: string;
  name: string;
  category: string;
}

interface UserTechStack {
  id: string;
  tech_stack_id: string;
  proficiency_level: number;
  tech_stacks: TechStack;
}

interface TechStackCardProps {
  userTechStacks: UserTechStack[];
  availableToAdd: TechStack[];
  isEditing: boolean;
  onRemoveTechStack: (userTechStackId: string) => void;
  onAddTechStack: (techStackId: string) => void;
}

const TechStackCard = ({ 
  userTechStacks, 
  availableToAdd, 
  isEditing, 
  onRemoveTechStack, 
  onAddTechStack 
}: TechStackCardProps) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Tech Stack</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {userTechStacks.map((userTech) => (
              <Badge 
                key={userTech.id} 
                variant="secondary" 
                className="bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 cursor-pointer"
                onClick={() => isEditing && onRemoveTechStack(userTech.id)}
              >
                {userTech.tech_stacks.name}
                {isEditing && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>

          {isEditing && availableToAdd.length > 0 && (
            <div>
              <Label>Add Tech Stack</Label>
              <div className="mt-2 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {availableToAdd.map((tech) => (
                    <Badge 
                      key={tech.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-neon-purple/20"
                      onClick={() => onAddTechStack(tech.id)}
                    >
                      + {tech.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TechStackCard;
