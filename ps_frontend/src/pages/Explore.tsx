import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/api/users";
import { Navbar } from "@/components/Navbar";
import { SearchGrid } from "@/components/SearchGrid";
import UserResultCard from "@/components/UserResultCard";
import { Input } from "@/components/ui/input";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { Topbar } from "@/components/Topbar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { mockExplorePosts } from "@/data/mockData";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ["userSearch", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, 20),
    enabled: debouncedQuery.trim().length > 0,
  });

  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
  } = useQuery({
    queryKey: ["userRecommendations"],
    queryFn: () => searchUsers(undefined, 12),
    staleTime: 60_000,
  });

  const people = debouncedQuery.trim().length > 0 ? searchResults : recommendations;
  const loadingPeople = debouncedQuery.trim().length > 0 ? searchLoading : recommendationsLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Topbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-6">
        <LeftSidebar />

        <main className="pt-4">
          <div className="mb-4 bg-card p-4 rounded-lg border border-border">


            <div className="mt-3">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Trending</h3>
              <div className="flex flex-wrap gap-2">
                {['#photography', '#art', '#design', '#nature', '#travel'].map((tag) => (
                  <button
                    key={tag}
                    className="px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-secondary/80 transition-base"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">

            <SearchGrid images={mockExplorePosts} />
          </div>
        </main>

        <RightSidebar />
      </div>

      <Navbar />
    </div>
  );
};

export default Explore;
