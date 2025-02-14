"use server";

import { Repo } from "@/types";

export async function fetchGitHubRepos(accessToken?: string, page: number = 1) {
  try {
    // Check if the access token is provided
    if (!accessToken) {
      throw new Error("GitHub access token not found");
    }

    // Fetch repositories for the specified page
    const response = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=100`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    // Handle non-OK responses
    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub repos: ${response.statusText}`);
    }

    // Parse and process the repositories
    const repos: Repo[] = await response.json();
    return repos.map(({ private: visibility, name, full_name }: Repo, i) => ({
      visibility,
      label: name,
      value: full_name,
      id: i.toString(),
    }));
  } catch (error) {
    console.error(error);
    throw new Error("An unexpected error occurred while fetching GitHub repos");
  }
}
