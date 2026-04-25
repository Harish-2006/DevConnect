
import { Users, Code, GitBranch, Star } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: Users,
      value: "10,000+",
      label: "Active Developers",
      color: "text-neon-blue"
    },
    {
      icon: Code,
      value: "50,000+",
      label: "Projects Shared",
      color: "text-neon-purple"
    },
    {
      icon: GitBranch,
      value: "100,000+",
      label: "Connections Made",
      color: "text-neon-green"
    },
    {
      icon: Star,
      value: "25,000+",
      label: "Stars Given",
      color: "text-neon-pink"
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="glass-card p-6 mb-4 group hover:neon-border transition-all duration-300">
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color} group-hover:animate-glow-pulse`} />
                <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
