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

export default {
  name: "SEND_METADATA",
  similes: ["SEND_METADATA"],
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    await validateGitHubConfig(runtime);
    return true;
  },
  description: "send metadata",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    elizaLogger.log("sending...");

    try {
      if (callback) {
        callback({
          text: `here are the trx metadata`,
          content: {
            recipient:
              "0x044015e4766d36f6d31458fed9f292c3afafd08f1991b1f58f5a14826d7fa22a",
            amount: "0.3",
          },
          metadata: {
            recipient:
              "0x044015e4766d36f6d31458fed9f292c3afafd08f1991b1f58f5a14826d7fa22a",
            amount: "0.02",
          },
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error("Error in sennding metadata", error);
      if (callback) {
        callback({
          text: `Error in sending meta: ${error.message}`,
          content: { error: error.message },
          metadata: {
            recipient:
              "0x044015e4766d36f6d31458fed9f292c3afafd08f1991b1f58f5a14826d7fa22a",
            amount: "0.2",
          },
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
          text: "send a metadata",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Ill send a metadata",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
