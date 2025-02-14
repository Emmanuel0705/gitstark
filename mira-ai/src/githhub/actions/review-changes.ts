import {
  type Action,
  type ActionExample,
  AgentRuntime,
  composeContext,
  type Content,
  elizaLogger,
  generateObjectDeprecated,
  type HandlerCallback,
  type IAgentRuntime,
  knowledge,
  type Memory,
  ModelClass,
  type State,
  stringToUuid,
} from "@elizaos/core";
import { validateGitHubConfig } from "../environment";
import { GitHubService } from "../providers/github-provider";
import { createHash } from "crypto";
import { text } from "stream/consumers";

export interface GitHubPRAnalysisContent extends Content {
  repository: string;
  pullNumber: number;
  accessToken?: string;
}

export function isGitHubPRAnalysisContent(
  content: GitHubPRAnalysisContent
): content is GitHubPRAnalysisContent {
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

  return true;
}

const githubPRAnalysisTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
        
        Example response:
        \`\`\`json
        {
            "repository": "owner/repo",
            "pullNumber": 123,
            "accessToken":"gho_yjsTvwF2ZfQMTYU3E0iekpVxQt6fbH22e"
        }
        \`\`\`
        
        {{recentMessages}}
        
        Given the recent messages, extract the following information about the GitHub pull request to analyze:
        - Repository (in the format owner/repo)
        - Pull request number
        - Github access token
        
        Respond with a JSON markdown block containing only the extracted values.`;

const analyzeChangesTemplate = `Review the following pull request changes and provide a detailed analysis:
  
  {{changes}}
  
  Respond with a JSON markdown block containing the analysis in the following format:
  \`\`\`json
  {
      "summary": "Brief overview of the main changes",
      "impactedAreas": ["List of components, features, or areas affected"],
     
  }
  \`\`\`
  `;

export default {
  name: "ANALYZE_PR_CHANGES",
  similes: [
    "REVIEW_PR_CHANGES",
    "CHECK_PR_DIFF",
    "GET_PR_CHANGES",
    "EXAMINE_PR_CHANGES",
  ],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description:
    "MUST use this action if the user requests to analyze or review changes in a GitHub pull request.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting ANALYZE_PR_CHANGES handler...");

    // Create or update state
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose PR analysis context
    const githubPRAnalysisContext = composeContext({
      state: currentState,
      template: githubPRAnalysisTemplate,
    });

    // Generate PR analysis content
    const content = await generateObjectDeprecated({
      runtime,
      context: githubPRAnalysisContext,
      modelClass: ModelClass.SMALL,
    });

    elizaLogger.debug("GitHub PR analysis content:", content);

    // Validate content
    if (!isGitHubPRAnalysisContent(content)) {
      elizaLogger.error("Invalid content for ANALYZE_PR_CHANGES action.");
      if (callback) {
        callback({
          text: "Please provide a valid repository and PR number.",
          content: { error: "Invalid PR analysis content" },
        });
      }
      return false;
    }

    try {
      const config = await validateGitHubConfig(runtime);
      const { repository, pullNumber, accessToken } = content;

      const githubService = new GitHubService(accessToken, repository);
      // Get PR changes as string
      const changes = await githubService.getPRChangesAsString(pullNumber);

      console.log({ changes });

      // Store changes in knowledge base
      const changesHash = createHash("sha256").update(changes).digest("hex");
      message.content.text = changes;
      message.id = stringToUuid(`pr_changes_${repository}_${pullNumber}`);

      runtime.knowledgeManager.addEmbeddingToMemory({
        agentId: runtime.agentId,

        content: { text: changes },
        roomId: message.roomId,
        userId: message.userId,
      });

      await knowledge.set(runtime as AgentRuntime, {
        id: stringToUuid(`pr_changes_${repository}_${pullNumber}`),
        content: {
          text: changes,
          hash: changesHash,
          source: "github",
          attachments: [],
          metadata: {
            type: "pr_changes",
            repository,
            pullNumber,
            timestamp: new Date().toISOString(),
          },
        },
      });

      let currentState = state;
      if (!currentState) {
        currentState = (await runtime.composeState(message)) as State;
      } else {
        currentState = await runtime.updateRecentMessageState(currentState);
      }

      // Analyze the changes
      const analysisContext = composeContext({
        state: currentState,
        template: analyzeChangesTemplate,
      });

      const analysis = await generateObjectDeprecated({
        runtime,
        context: analysisContext,
        modelClass: ModelClass.LARGE, // Use larger model for better analysis
      });

      console.log({ text: message.content.text, analysis });

      if (callback) {
        // Format the analysis into a human-readable response
        const response = formatAnalysisResponse(analysis, pullNumber);
        callback({
          text: response,
          content: { analysis, changes },
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error analyzing PR changes:", error);
      if (callback) {
        callback({
          text: `Error analyzing PR changes: ${error.message}`,
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
          text: "Analyze the changes in PR #123 in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I've analyzed PR #123 in elizaos/core. Here's what I found:\n\nThis PR adds a new feature for handling async operations and includes some bug fixes. The main changes affect the core runtime module...",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Review what changed in pull request #456 in elizaos/core",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I've reviewed PR #456 in elizaos/core. The changes primarily focus on performance improvements in the data processing pipeline...",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;

function formatAnalysisResponse(analysis: any, pullNumber: number): string {
  const { summary, impactedAreas } = analysis;

  return `I've analyzed PR #${pullNumber}. Here's what I found:
  
  Summary: ${summary}
  
  Impacted Areas:
  ${impactedAreas.map((area: string) => `- ${area}`).join("\n")}`;
}
