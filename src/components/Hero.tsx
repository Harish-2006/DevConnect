
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 border border-neon-blue/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-20 h-20 border border-neon-purple/30 rounded-lg rotate-45 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 border border-neon-green/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          {/* Hero Badge */}
          <div className="inline-flex items-center space-x-2 mb-6">
            <Badge variant="outline" className="glass-button border-neon-blue/50 text-neon-blue">
              <Star className="w-3 h-3 mr-1" />
              New Platform
            </Badge>
            <Badge variant="outline" className="glass-button border-neon-green/50 text-neon-green">
              100% Free
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Where <span className="neon-text">Developers</span>
            <br />
            Connect & Create
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
            Showcase your projects, discover talented developers, and build the future together. 
            Join the most innovative developer community.
          </p>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>10K+ Developers</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4" />
              <span>50K+ Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
