"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ProcessedRepo } from "@/types";
import { fetchGitHubRepos } from "@/app/actions/fetch-repos";

export const useRepos = (accessToken: string) => {
  return useInfiniteQuery<
    ProcessedRepo[], // TData (type of each page)
    Error, // TError
    {
      // Combined data type
      pages: ProcessedRepo[][];
      pageParams: number[];
    },
    [string, string], // Query key type
    number // Page param type
  >({
    queryKey: ["repos", accessToken],
    queryFn: ({ pageParam }) => fetchGitHubRepos(accessToken, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 200 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
