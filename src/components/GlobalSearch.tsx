import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Rocket, Users, Calendar, FileText, Award } from 'lucide-react';
import { startupsService } from '@/services/startups.service';
import { communitiesService } from '@/services/communities.service';
import { eventsService } from '@/services/events.service';
import { blogService } from '@/services/blog.service';
import { advocatesService } from '@/services/advocates.service';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    startups: [],
    communities: [],
    events: [],
    blogPosts: [],
    advocates: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Keyboard shortcut detection
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search function with debouncing
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({
        startups: [],
        communities: [],
        events: [],
        blogPosts: [],
        advocates: [],
      });
      return;
    }

    setIsLoading(true);
    const lowerQuery = searchQuery.toLowerCase();

    try {
      // Search across all content types
      const [startups, communities, events, blogPosts, advocates] = await Promise.all([
        startupsService.getStartups(),
        communitiesService.getCommunities(),
        eventsService.getEvents(),
        blogService.getBlogPosts(),
        advocatesService.getAdvocates(),
      ]);

      setResults({
        startups: startups
          .filter(
            (s) =>
              s.name.toLowerCase().includes(lowerQuery) ||
              s.description?.toLowerCase().includes(lowerQuery) ||
              s.category?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 3),
        communities: communities
          .filter(
            (c) =>
              c.name.toLowerCase().includes(lowerQuery) ||
              c.description?.toLowerCase().includes(lowerQuery) ||
              c.city?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 3),
        events: events
          .filter(
            (e) =>
              e.title.toLowerCase().includes(lowerQuery) ||
              e.description?.toLowerCase().includes(lowerQuery) ||
              e.location?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 3),
        blogPosts: blogPosts
          .filter(
            (b) =>
              b.title.toLowerCase().includes(lowerQuery) ||
              b.excerpt?.toLowerCase().includes(lowerQuery) ||
              b.content?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 3),
        advocates: advocates
          .filter(
            (a) =>
              a.name.toLowerCase().includes(lowerQuery) ||
              a.bio?.toLowerCase().includes(lowerQuery) ||
              a.expertise?.toLowerCase().includes(lowerQuery) ||
              a.specializations?.some((s) => s.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 3),
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const totalResults =
    results.startups.length +
    results.communities.length +
    results.events.length +
    results.blogPosts.length +
    results.advocates.length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t('search.placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? t('search.searching') : t('search.noResults')}
        </CommandEmpty>

        {/* Startups */}
        {results.startups.length > 0 && (
          <CommandGroup heading={t('nav.startups')}>
            {results.startups.map((startup: any) => (
              <CommandItem
                key={startup.id}
                value={startup.name}
                onSelect={() => handleSelect('/startups')}
              >
                <Rocket className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{startup.name}</span>
                  {startup.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {startup.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Communities */}
        {results.communities.length > 0 && (
          <CommandGroup heading={t('nav.communities')}>
            {results.communities.map((community: any) => (
              <CommandItem
                key={community.id}
                value={community.name}
                onSelect={() => handleSelect('/communities')}
              >
                <Users className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{community.name}</span>
                  {community.city && (
                    <span className="text-xs text-muted-foreground">
                      {community.city}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Events */}
        {results.events.length > 0 && (
          <CommandGroup heading={t('nav.events')}>
            {results.events.map((event: any) => (
              <CommandItem
                key={event.id}
                value={event.title}
                onSelect={() => handleSelect('/eventos')}
              >
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{event.title}</span>
                  {event.location && (
                    <span className="text-xs text-muted-foreground">
                      {event.location}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Blog Posts */}
        {results.blogPosts.length > 0 && (
          <CommandGroup heading={t('nav.blog')}>
            {results.blogPosts.map((post: any) => (
              <CommandItem
                key={post.id}
                value={post.title}
                onSelect={() => handleSelect(`/blog/${post.slug}`)}
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{post.title}</span>
                  {post.excerpt && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {post.excerpt}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Advocates */}
        {results.advocates.length > 0 && (
          <CommandGroup heading={t('nav.advocates')}>
            {results.advocates.map((advocate: any) => (
              <CommandItem
                key={advocate.id}
                value={advocate.name}
                onSelect={() => handleSelect('/referentes')}
              >
                <Award className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>{advocate.name}</span>
                  {advocate.expertise && (
                    <span className="text-xs text-muted-foreground">
                      {advocate.expertise}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
