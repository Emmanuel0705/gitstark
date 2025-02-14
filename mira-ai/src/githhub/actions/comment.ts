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

export interface GitHubPRCommentContent extends Content {
  repository: string;
  pullNumber: number;
  comment: string;
  accessToken?: string;
}

export function isGitHubPRCommentContent(
  content: GitHubPRCommentContent
): content is GitHubPRCommentContent {
  // Validate types
  const validTypes =
    typeof content.repository === "string" &&
    typeof content.pullNumber === "number" &&
    typeof content.comment === "string";

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

  // Validate comment
  if (!content.comment.trim()) {
    return false;
  }

  return true;
}

const githubPRCommentTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    
    Example response:
    \`\`\`json
    {
        "repository": "owner/repo",
        "pullNumber": 123,
        "comment": "Great work! Just a few minor suggestions...",
        "accessToken":"gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6fbH22e"
    }
    \`\`\`
    
    {{recentMessages}}
    
    Given the recent messages, extract the following information about the GitHub pull request comment:
    - Repository (in the format owner/repo)
    - Pull request number
    - Comment text
    - Github access token
    
    Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "COMMENT_ON_PR",
  similes: [
    "ADD_PR_COMMENT",
    "COMMENT_PULL_REQUEST",
    "ADD_COMMENT_TO_PR",
    "POST_PR_COMMENT",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description:
    "MUST use this action if the user requests to add a comment to a GitHub pull request.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting COMMENT_ON_PR handler...");

    // Create or update state
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose PR comment context
    const githubPRCommentContext = composeContext({
      state: currentState,
      template: githubPRCommentTemplate,
    });

    // Generate PR comment content
    const content = await generateObjectDeprecated({
      runtime,
      context: githubPRCommentContext,
      modelClass: ModelClass.SMALL,
    });

    elizaLogger.debug("GitHub PR comment content:", content);

    console.log({ content });

    // Validate content
    if (!isGitHubPRCommentContent(content)) {
      elizaLogger.error("Invalid content for COMMENT_ON_PR action.");
      if (callback) {
        callback({
          text: "Please provide a valid repository, PR number, and comment text.",
          content: { error: "Invalid PR comment content" },
        });
      }
      return false;
    }

    try {
      const config = await validateGitHubConfig(runtime);
      const { repository, pullNumber, comment, accessToken } = content;

      const githubService = new GitHubService(accessToken, repository);
      const commentUrl = await githubService.createPRComment(
        pullNumber,
        comment
      );

      if (callback) {
        callback({
          text: `Comment added successfully to PR #${pullNumber}! Comment URL: ${commentUrl}`,
          content: { commentUrl },
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error adding PR comment:", error);
      if (callback) {
        callback({
          text: `Error adding comment to PR: ${error.message}`,
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
          text: "Add a comment to PR #123 in elizaos/core: 'Looks good, but please add tests'",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll add your comment to pull request #123 in elizaos/core.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Comment on pull request #456 in elizaos/core: 'Need to fix the linting issues'",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll add a comment about the linting issues to PR #456 in elizaos/core.",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
