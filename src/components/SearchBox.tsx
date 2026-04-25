
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Folder } from 'lucide-react';

interface SearchResult {
  type: 'user' | 'project';
  id: string;
  title: string;
  subtitle: string;
  avatar_url?: string;
  image_url?: string;
}

interface SearchBoxProps {
  onUserSelect?: (userId: string) => void;
  onProjectSelect?: (projectId: string) => void;
}

const SearchBox = ({ onUserSelect, onProjectSelect }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      // Search users by username or full name
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (usersError) throw usersError;

      // Search projects by title
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, 
          title, 
          description, 
          image_url,
          profiles (username, full_name)
        `)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (projectsError) throw projectsError;

      const searchResults: SearchResult[] = [
        ...(users || []).map(user => ({
          type: 'user' as const,
          id: user.id,
          title: user.full_name || user.username,
          subtitle: `@${user.username}`,
          avatar_url: user.avatar_url
        })),
        ...(projects || []).map(project => ({
          type: 'project' as const,
          id: project.id,
          title: project.title,
          subtitle: `by @${project.profiles?.username}`,
          image_url: project.image_url
        }))
      ];

      setResults(searchResults);
    } catch (error: any) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user' && onUserSelect) {
      onUserSelect(result.id);
    } else if (result.type === 'project' && onProjectSelect) {
      onProjectSelect(result.id);
    }
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search users or projects..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10 glass-input"
          onFocus={() => setShowResults(query.length > 0)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
      </div>

      {showResults && (query.length > 0) && (
        <Card className="absolute top-full mt-1 w-full z-50 glass-card border-white/20">
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-blue"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    {result.type === 'user' ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback className="text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                        {result.image_url ? (
                          <img src={result.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <Folder className="w-4 h-4 text-neon-blue" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.title}</p>
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No results found for "{query}"
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBox;
