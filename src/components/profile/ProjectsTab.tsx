
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Github, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface ProjectsTabProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
}

const ProjectsTab = ({ projects, onDeleteProject }: ProjectsTabProps) => {
  const navigate = useNavigate();

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-neon-purple" />
            My Projects ({projects.length})
          </CardTitle>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-neon-blue hover:bg-neon-blue/80 text-black"
          >
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first project!</p>
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black"
            >
              Add Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="glass-card cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent className="p-4">
                  {project.image_url && (
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-full h-32 object-contain rounded-lg mb-3 bg-black/5"
                    />
                  )}
                  <h4 className="font-semibold text-neon-blue mb-2">{project.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {project.github_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-button p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.github_url, '_blank');
                          }}
                        >
                          <Github className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsTab;
