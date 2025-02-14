"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRepos } from "@/hooks/use-repos";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useRepoStore } from "@/stores/repo-store";
import useStore from "@/hooks/use-Store";

export function SelectRepoCombobox({
  image,
  accessToken,
}: {
  image?: string;
  accessToken?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { setSelectedRepo } = useRepoStore();
  const selectedRepo = useStore(useRepoStore, (state) => state.selectedRepo);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRepos(accessToken as string);

  // Combine all pages of repositories into a single array
  const allRepos = React.useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  console.log("allRepos", allRepos.length);

  const commandListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const commandList = commandListRef.current;
    if (!commandList) return;

    const handleScroll = () => {
      const scrollPosition = commandList.scrollTop + commandList.clientHeight;
      const scrollHeight = commandList.scrollHeight;
      const threshold = 50; // pixels from bottom to trigger load

      if (
        scrollHeight - scrollPosition < threshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        console.log("fetching next page");

        fetchNextPage();
      }
    };

    commandList.addEventListener("scroll", handleScroll);
    return () => commandList.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="flex gap-x-2 items-center line-clamp-1">
            <Avatar className="size-4 rounded-sm">
              <AvatarImage src={image} alt="@github" />
              <AvatarFallback></AvatarFallback>
            </Avatar>
            {selectedRepo && allRepos.length > 0
              ? allRepos.find((repo) => repo.value === selectedRepo)?.label
              : "Select repository..."}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search repository..." />
          <CommandList
            ref={commandListRef}
            className="max-h-[320px] overflow-y-auto"
          >
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin mx-auto" />
              ) : null}
              {allRepos.map((repo) => (
                <CommandItem
                  key={repo.value}
                  value={repo.value}
                  onSelect={(currentValue) => {
                    setSelectedRepo(
                      currentValue === selectedRepo ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <span className="flex gap-x-2 items-center ">
                    {repo.label}
                    {repo.visibility ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="!w-3 !h-3 opacity-40" />
                          </TooltipTrigger>
                          <TooltipContent className="">
                            <span>Private</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedRepo === repo.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              {isFetchingNextPage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin mx-auto" />
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
