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

export interface GitHubIssueContent extends Content {
  repository: string;
  title: string;
  body: string;
  labels?: string[];
  accessToken?: string;
}

export function isGitHubIssueContent(
  content: GitHubIssueContent
): content is GitHubIssueContent {
  // Validate types
  const validTypes =
    typeof content.repository === "string" &&
    typeof content.title === "string" &&
    typeof content.body === "string";
  if (!validTypes) {
    return false;
  }

  console.log({ content });

  // Validate repository format (owner/repo)
  // const validRepository = content?.repository?.split("/")?.length === 2;
  // if (!validRepository) {
  //   return false;
  // }

  if (!content.repository) {
    return false;
  }

  return true;
}

const githubIssueTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
  
  Example response:
  \`\`\`json
  {
      "repository": "owner/repo",
      "title": "Issue Title",
      "body": "Issue Description",
      "labels": ["bug", "urgent"],
      "accessToken":"gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6fbH22e"
  }
  \`\`\`
  
  {{recentMessages}}
  
  Given the recent messages, extract the following information about the requested GitHub issue:
  - Repository (in the format owner/repo)
  - Issue title
  - Issue body
  - Labels (optional)
  - Github access token
  
  Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "CREATE_GITHUB_ISSUE",
  similes: [
    "CREATE_ISSUE_ON_GITHUB",
    "OPEN_GITHUB_ISSUE",
    "MAKE_GITHUB_ISSUE",
    "REPORT_ISSUE_ON_GITHUB",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description:
    "MUST use this action if the user requests to create a GitHub issue. The request might be varied, but it will always be a GitHub issue creation.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting CREATE_GITHUB_ISSUE handler...");

    console.log("Creating GitHub issue...");

    // Fix: Create new variable instead of reassigning parameter
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose GitHub issue context
    const githubIssueContext = composeContext({
      state: currentState,
      template: githubIssueTemplate,
    });

    // Generate GitHub issue content
    const content = await generateObjectDeprecated({
      runtime,
      context: githubIssueContext,
      modelClass: ModelClass.SMALL,
    });

    elizaLogger.debug("GitHub Issue content:", content);

    // Validate GitHub issue content
    if (!isGitHubIssueContent(content)) {
      elizaLogger.error("Invalid content for CREATE_GITHUB_ISSUE action.");
      if (callback) {
        callback({
          text: "Not enough information to create a GitHub issue. Please respond with repository, title, body, and optional labels.",
          content: { error: "Invalid GitHub issue content" },
        });
      }
      return false;
    }

    try {
      const config = await validateGitHubConfig(runtime);
      const { repository, title, body, labels, accessToken } = content;

      const githubService = new GitHubService(
        accessToken,
        repository as string
      );
      const issueUrl = await githubService.createIssue(
        title as string,
        body as string,
        labels || ["task"]
      );

      if (callback) {
        callback({
          text: `GitHub issue created successfully! Issue URL: ${issueUrl}`,
          content: {},
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error during GitHub issue creation:", error);
      if (callback) {
        callback({
          text: `Error creating GitHub issue: ${error.message}`,
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
          text: "Create a GitHub issue in elizaos/core with title 'Bug Fix' and body 'There is a bug in the core module.'",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll create a GitHub issue in elizaos/core with the title 'Bug Fix' and body 'There is a bug in the core module.' Let me process that for you.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Open an issue in elizaos/core with title 'Feature Request' and body 'We need a new feature to handle GitHub issues.' and label it as 'enhancement'",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll create a GitHub issue in elizaos/core with the title 'Feature Request' and body 'We need a new feature to handle GitHub issues.' and label it as 'enhancement'. Let me process that for you.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you create an issue in elizaos/core with title 'Documentation Update' and body 'The documentation needs to be updated.'?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Executing creation of a GitHub issue in elizaos/core with the title 'Documentation Update' and body 'The documentation needs to be updated.'. One moment please.",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
