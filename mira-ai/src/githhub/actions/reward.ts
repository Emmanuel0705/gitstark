import {
  type Action,
  type ActionExample,
  elizaLogger,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  composeContext,
  generateObjectDeprecated,
  ModelClass,
} from "@elizaos/core";
import { validateGitHubConfig } from "../environment";

const githubPRTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    
    Example response:
    \`\`\`json
    {
        "prs": [
            { "id": 19, "amount": 20 },
            { "id": 12, "amount": 50 }
        ]
    }
    \`\`\`
    
    {{recentMessages}}
    
    Given the recent messages, extract the following information about the requested pull requests:
    - Pull request IDs
    - Optional amounts associated with each pull request
    
    Respond with a JSON markdown block containing only the extracted values.`;

export default {
  name: "EXTRACT_PR_IDS_AMOUNTS",
  similes: ["PARSE_PR_IDS", "EXTRACT_PR_DETAILS", "GET_PR_IDS_WITH_AMOUNTS"],
  description:
    "Extracts pull request IDs and optional amounts from a user's message.",
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("Starting EXTRACT_PR_IDS_AMOUNTS handler...");

    // Compose context for extracting PR IDs and amounts
    const prExtractionContext = composeContext({
      state: _state,
      template: githubPRTemplate,
    });

    // Generate the extracted object
    const extractedPRs = await generateObjectDeprecated({
      runtime,
      context: prExtractionContext,
      modelClass: ModelClass.SMALL,
    });

    if (!extractedPRs || !extractedPRs.prs || extractedPRs.prs.length === 0) {
      elizaLogger.warn("No PRs found in the message.");
      if (callback) {
        callback({
          text: "No valid pull request IDs found in the message.",
          content: { prs: [] },
        });
      }
      return false;
    }

    elizaLogger.debug("Extracted PRs:", extractedPRs);

    if (callback) {
      callback({
        text: "Extracted pull request IDs and amounts.",
        content: { prs: extractedPRs.prs },
      });
    }

    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Reward #19:20, #12:50 to contributors" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Extracted pull request IDs and amounts.",
          content: {
            prs: [
              { id: 19, amount: 20 },
              { id: 12, amount: 50 },
            ],
          },
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Consider #7 and #15 for rewards" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Extracted pull request IDs.",
          content: { prs: [{ id: 7 }, { id: 15 }] },
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
