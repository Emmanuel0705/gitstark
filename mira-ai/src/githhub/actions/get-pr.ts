import {
  type Action,
  type ActionExample,
  composeContext,
  type Content,
  elizaLogger,
  generateObjectDeprecated,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelClass,
  type State,
} from "@elizaos/core";
import { validateGitHubConfig } from "../environment";
import { GitHubService } from "../providers/github-provider";

export interface GitHubListPRsContent extends Content {
  repository: string;
  accessToken?: string;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  url: string;
}

export function isGitHubListPRsContent(
  content: GitHubListPRsContent
): content is GitHubListPRsContent {
  // Validate repository string exists
  if (!content.repository || typeof content.repository !== "string") {
    return false;
  }

  return true;
}

const githubListPRsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
        
        Example response:
        \`\`\`json
        {
            "repository": "owner/repo",
            "accessToken":"gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6fbH22e"
        }
        \`\`\`
        
        {{recentMessages}}
        
        Given the recent messages, extract the following information about the GitHub pull request:
        - Repository (in the format owner/repo)
        - Github access token
        
        Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "LIST_GITHUB_PRS",
  similes: [
    "GET_OPEN_PRS",
    "SHOW_PULL_REQUESTS",
    "LIST_OPEN_PULL_REQUESTS",
    "FETCH_GITHUB_PRS",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description:
    "MUST use this action if the user requests to list, show, or get open pull requests from a GitHub repository.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting LIST_GITHUB_PRS handler...");

    // Create or update state
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose list PRs context
    const githubListPRsContext = composeContext({
      state: currentState,
      template: githubListPRsTemplate,
    });

    // Get repository information
    const content = await generateObjectDeprecated({
      runtime,
      context: githubListPRsContext,
      modelClass: ModelClass.SMALL,
    });

    console.log({ content });

    elizaLogger.debug("GitHub List PRs content:", content);

    // Validate content
    if (!isGitHubListPRsContent(content)) {
      elizaLogger.error("Invalid content for LIST_GITHUB_PRS action.");
      if (callback) {
        callback({
          text: "Please provide a valid repository name in the format owner/repo.",
          content: { error: "Invalid repository format" },
        });
      }
      return false;
    }

    try {
      const config = await validateGitHubConfig(runtime);
      const { repository, accessToken } = content;

      console.log({ repository, accessToken });

      const githubService = new GitHubService(accessToken, repository);

      // Fetch open pull requests
      const pullRequests: PullRequestInfo[] =
        await githubService.listOpenPullRequests();

      if (pullRequests.length === 0) {
        if (callback) {
          callback({
            text: `No open pull requests found in ${repository}.`,
            content: { pullRequests: [] },
          });
        }
        return true;
      }

      // Format the response message
      const prList = pullRequests
        .map((pr) => `#${pr.number}: ${pr.title} (by ${pr.author})`)
        .join("\n");

      if (callback) {
        callback({
          text: `Open Pull Requests in ${repository}:\n${prList}`,
          content: { pullRequests },
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error fetching pull requests:", error);
      if (callback) {
        callback({
          text: `Error fetching pull requests: ${error.message}`,
          content: { error: error.message },
        });
      }
      return false;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show me all open PRs in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll fetch all open pull requests from the elizaos/core repository.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "List the current pull requests in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll get a list of all open pull requests from elizaos/core for you.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Get open PRs from elizaos/core repository",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll retrieve all open pull requests from the elizaos/core repository.",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
