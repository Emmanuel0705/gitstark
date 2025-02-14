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
import { getStarknetAccount } from "../../starknet/utils";
import { ERC20Token } from "../../starknet/utils/ERC20Token";
import { PROVIDER_CONFIG } from "../..";

export interface GitHubMergePRContent extends Content {
  repository: string;
  pullNumber: number;
  mergeMethod?: "merge" | "squash" | "rebase";
  commitMessage?: string;
  accessToken?: string;
  rewardAmount?: number;
}

function extractWalletAddress(message) {
  console.log({ message });
  const regex = /0x[a-fA-F0-9]{40,64}/g; // Matches Ethereum-like addresses (40-64 hex characters)
  const matches = message?.match(regex);
  return matches ? matches[0] : null;
}

export function isGitHubMergePRContent(
  content: GitHubMergePRContent
): content is GitHubMergePRContent {
  // Validate types
  const validTypes =
    typeof content.repository === "string" &&
    typeof content.pullNumber === "number";

  if (!validTypes) {
    return false;
  }

  // Validate repository existence
  if (!content.repository) {
    return false;
  }

  // Validate pull request number
  if (content.pullNumber <= 0) {
    return false;
  }

  if (!content.accessToken || !content.accessToken.startsWith("gho_")) {
    return false;
  }

  return true;
}

const githubMergePRTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    
    Example response:
    \`\`\`json
    {
        "repository": "owner/repo",
        "pullNumber": 123,
        "mergeMethod": "merge",
        "commitMessage": "Merge pull request #123: Feature implementation",
        "accessToken":"gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6fbH22e",
        "rewardAmount": 10, // Optional reward amount"
    }
    \`\`\`
    
    {{recentMessages}}
    
    Given the recent messages, extract the following information about the GitHub pull request merge:
    - Repository (in the format owner/repo)
    - Pull request number
    - Merge method (merge, squash, or rebase) if specified
    - Custom commit message if provided
    - Github access token
    - Optional reward amount
    
    Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "MERGE_GITHUB_PR",
  similes: [
    "MERGE_PR",
    "MERGE_PULL_REQUEST",
    "COMPLETE_PR",
    "ACCEPT_PR",
    "REWARD_PR",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description:
    "MUST use this action if the user requests to merge a GitHub pull request.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting MERGE_GITHUB_PR handler...");

    // Create or update state
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose merge PR context
    const githubMergePRContext = composeContext({
      state: currentState,
      template: githubMergePRTemplate,
    });

    // Generate merge PR content
    const content = await generateObjectDeprecated({
      runtime,
      context: githubMergePRContext,
      modelClass: ModelClass.SMALL,
    });

    elizaLogger.debug("GitHub Merge PR content:", content);

    console.log({ content });

    // Validate content
    if (!isGitHubMergePRContent(content)) {
      elizaLogger.error("Invalid content for MERGE_GITHUB_PR action.");
      if (callback) {
        callback({
          text: "Please provide a valid repository and PR number.",
          content: { error: "Invalid merge PR content" },
        });
      }
      return false;
    }

    try {
      const config = await validateGitHubConfig(runtime);
      const {
        repository,
        pullNumber,
        mergeMethod,
        commitMessage,
        accessToken,
      } = content;

      const githubService = new GitHubService(accessToken, repository);

      // Check if PR is mergeable
      const { mergeable, body, reason } = await githubService.checkPRMergeable(
        pullNumber
      );

      if (!mergeable) {
        if (callback) {
          callback({
            text: `Cannot merge PR #${pullNumber}: ${reason}`,
            content: { error: "PR not mergeable", details: reason },
          });
        }
        return false;
      }

      const walletAddress = extractWalletAddress(body);
      let trxMsg = null;
      let trxData = null;
      if (walletAddress && content.rewardAmount) {
        trxData = {
          amount: content.rewardAmount,
          recipient: walletAddress,
        };
        trxMsg = `PROCESS_TRX:::${JSON.stringify(trxData)}`;
      }

      const mergeResult = await githubService.mergePR(
        pullNumber,
        mergeMethod || "merge",
        commitMessage ||
          `Merge pull request #${pullNumber}, ${trxMsg ? trxMsg : ""}`
      );

      if (callback) {
        callback({
          text: `Successfully merged PR #${pullNumber}! Merge commit: ${mergeResult.sha} `,
          content: { mergeResult },
          metadata: {
            ...trxData,
          },
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error merging PR:", error);
      if (callback) {
        callback({
          text: `Error merging PR: ${error.message}`,
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
          text: "Merge PR #123 in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll merge pull request #123 in elizaos/core if it's mergeable.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Squash and merge PR #456 in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll squash and merge pull request #456 in elizaos/core if it's mergeable.",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
