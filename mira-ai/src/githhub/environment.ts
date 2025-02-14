import type { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const githubEnvSchema = z.object({
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_API_URL: z
    .string()
    .url("GitHub API URL must be a valid URL")
    .optional(),
});

export type GitHubConfig = z.infer<typeof githubEnvSchema>;

export async function validateGitHubConfig(
  runtime: IAgentRuntime
): Promise<GitHubConfig> {
  try {
    const config = {
      GITHUB_TOKEN:
        runtime.getSetting("GITHUB_TOKEN") ||
        "gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6f",
      GITHUB_API_URL:
        runtime.getSetting("GITHUB_API_URL") ||
        process.env.GITHUB_API_URL ||
        "https://api.github.com",
    };

    console.log({ config, token: runtime.getSetting("GITHUB_TOKEN") });

    return githubEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `GitHub configuration validation failed:\n${errorMessages}`
      );
    }
    throw error;
  }
}
