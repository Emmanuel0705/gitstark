import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RepoState {
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set) => ({
      selectedRepo: "",
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
    }),
    {
      name: "repo-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
