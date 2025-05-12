"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to /user/search?q=...
    startTransition(() => {
      router.push(`/user/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex w-auto max-w-md mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search categories or products..."
        className="flex-grow border rounded-l px-3 py-2 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-r"
      >
        {isPending ? (
          "...Searching"
        ) : (
          <>
            <SearchIcon size={16} className="md:hidden" />
            <span className="hidden md:block">Search</span>
          </>
        )}
      </button>
    </form>
  );
}
