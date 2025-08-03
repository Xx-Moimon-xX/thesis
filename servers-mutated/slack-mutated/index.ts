#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

interface SlackChannel {
  id: string;
  name?: string;
  created?: number;
  num_members?: number;
  value: string;
}

interface SlackUser {
  id: string;
  name?: string;
  real_name?: string;
  title?: string;
}

// Type definitions for tool arguments
interface ListChannelsArgs {
  limit?: number;
  cursor?: string;
}

// interface PostMessageArgs {
//   channel_id: string;
//   text: string;
// }

// interface ReplyToThreadArgs {
//   channel_id: string;
//   thread_ts: string;
//   text: string;
// }

interface AddReactionArgs {
  channel_id: string;
  timestamp: string;
  reaction: string;
}

interface GetChannelHistoryArgs {
  channel_id: string;
  limit?: number;
}

interface GetThreadRepliesArgs {
  channel_id: string;
  thread_ts: string;
}

interface GetUsersArgs {
  cursor?: string;
  limit?: number;
}

interface GetUserProfileArgs {
  user_id: string;
}

interface SearchMessagesArgs {
  query: string;
  count?: number;
  cursor?: string;
  highlight?: boolean;
  page?: number;
  sort?: 'score' | 'timestamp';
  sort_dir?: 'asc' | 'desc';
}

// Tool definitions
const listChannelsTool: Tool = {
  name: "slack_list_channels",
  description: "List public or pre-defined channels in the workspace with pagination",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description:
          "Maximum number of channels to return (default 500, max 1000)",
        default: 500,
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page of results",
      },
    },
  },
};

// const postMessageTool: Tool = {
//   name: "slack_post_message",
//   description: "Post a new message to a Slack channel",
//   inputSchema: {
//     type: "object",
//     properties: {
//       channel_id: {
//         type: "string",
//         description: "The ID of the channel to post to",
//       },
//       text: {
//         type: "string",
//         description: "The message text to post",
//       },
//     },
//     required: ["channel_id", "text"],
//   },
// };

// const replyToThreadTool: Tool = {
//   name: "slack_reply_to_thread",
//   description: "Reply to a specific message thread in Slack",
//   inputSchema: {
//     type: "object",
//     properties: {
//       channel_id: {
//         type: "string",
//         description: "The ID of the channel containing the thread",
//       },
//       thread_ts: {
//         type: "string",
//         description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
//       },
//       text: {
//         type: "string",
//         description: "The reply text",
//       },
//     },
//     required: ["channel_id", "thread_ts", "text"],
//   },
// };

// const addReactionTool: Tool = {
//   name: "slack_add_reaction",
//   description: "Add a reaction emoji to a message",
//   inputSchema: {
//     type: "object",
//     properties: {
//       channel_id: {
//         type: "string",
//         description: "The ID of the channel containing the message",
//       },
//       timestamp: {
//         type: "string",
//         description: "The timestamp of the message to react to",
//       },
//       reaction: {
//         type: "string",
//         description: "The name of the emoji reaction (without ::)",
//       },
//     },
//     required: ["channel_id", "timestamp", "reaction"],
//   },
// };

const getChannelHistoryTool: Tool = {
  name: "slack_get_channel_history",
  description: "Get recent messages from a channel",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "The ID of the channel",
      },
      limit: {
        type: "number",
        description: "Number of messages to retrieve (default 10)",
        default: 10,
      },
    },
    required: ["channel_id"],
  },
};

const getThreadRepliesTool: Tool = {
  name: "slack_get_thread_replies",
  description: "Get all replies in a message thread",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "The ID of the channel containing the thread",
      },
      thread_ts: {
        type: "string",
        description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
      },
    },
    required: ["channel_id", "thread_ts"],
  },
};

const getUsersTool: Tool = {
  name: "slack_get_users",
  description:
    "Get a list of all users in the workspace with their basic profile information",
  inputSchema: {
    type: "object",
    properties: {
      cursor: {
        type: "string",
        description: "Pagination cursor for next page of results",
      },
      limit: {
        type: "number",
        description: "Maximum number of users to return (default 1000, max 1000)",
        default: 1000,
      },
    },
  },
};

const getUserProfileTool: Tool = {
  name: "slack_get_user_profile",
  description: "Get detailed profile information for a specific user",
  inputSchema: {
    type: "object",
    properties: {
      user_id: {
        type: "string",
        description: "The ID of the user",
      },
    },
    required: ["user_id"],
  },
};

// const searchMessagesTool: Tool = {
//   name: "slack_search_messages",
//   description: "Search for messages matching a query in the Slack workspace",
//   inputSchema: {
//     type: "object",
//     properties: {
//       query: {
//         type: "string",
//         description: "Search query. You can use modifiers like 'in:channel_name', 'from:@username', etc.",
//       },
//       count: {
//         type: "number",
//         description: "Number of items to return per page (default 20)",
//         default: 20,
//       },
//       cursor: {
//         type: "string",
//         description: "Use this when getting results with cursor pagination. For first call send '*' for subsequent calls, send the value of 'next_cursor' returned in the previous call's results",
//       },
//       highlight: {
//         type: "boolean",
//         description: "Pass true to enable query highlight markers",
//         default: false,
//       },
//       page: {
//         type: "number",
//         description: "Page number of results to return (default 1)",
//         default: 1,
//       },
//       sort: {
//         type: "string",
//         description: "Return matches sorted by either 'score' or 'timestamp' (default 'score')",
//         enum: ["score", "timestamp"],
//         default: "score",
//       },
//       sort_dir: {
//         type: "string",
//         description: "Change sort direction to ascending ('asc') or descending ('desc') (default 'desc')",
//         enum: ["asc", "desc"],
//         default: "desc",
//       },
//     },
//     required: ["query"],
//   },
// };

class SlackClient {
  private botHeaders: { Authorization: string; "Content-Type": string };
  private userHeaders: { Authorization: string; "Content-Type": string };

  constructor(botToken: string, userToken?: string) {
    this.botHeaders = {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    };
    
    this.userHeaders = {
      Authorization: `Bearer ${userToken || botToken}`,
      "Content-Type": "application/json",
    };
  }

  async getChannels(cursor?: string): Promise<any> {
    let allChannels: SlackChannel[] = [];
    const params = new URLSearchParams({
      types: "public_channel",
      exclude_archived: "true",
      limit: "1000",
      team_id: process.env.SLACK_TEAM_ID!,
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(
      `https://slack.com/api/conversations.list?${params}`,
      { headers: this.botHeaders },
    );
    
    const channels = await response.json();
    allChannels = channels.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      created: channel.created,
      num_members: channel.num_members,
      value: channel.purpose?.value || ''
    }));

    return {
      ok: true,
      channels: allChannels,
      response_metadata: { next_cursor: "" },
    };
  }

//   async postMessage(channel_id: string, text: string): Promise<any> {
//     const response = await fetch("https://slack.com/api/chat.postMessage", {
//       method: "POST",
//       headers: this.botHeaders,
//       body: JSON.stringify({
//         channel: channel_id,
//         text: text,
//       }),
//     });

//     return response.json();
//   }

//   async postReply(
//     channel_id: string,
//     thread_ts: string,
//     text: string,
//   ): Promise<any> {
//     const response = await fetch("https://slack.com/api/chat.postMessage", {
//       method: "POST",
//       headers: this.botHeaders,
//       body: JSON.stringify({
//         channel: channel_id,
//         thread_ts: thread_ts,
//         text: text,
//       }),
//     });

//     return response.json();
//   }

//   async addReaction(
//     channel_id: string,
//     timestamp: string,
//     reaction: string,
//   ): Promise<any> {
//     const response = await fetch("https://slack.com/api/reactions.add", {
//       method: "POST",
//       headers: this.botHeaders,
//       body: JSON.stringify({
//         channel: channel_id,
//         timestamp: timestamp,
//         name: reaction,
//       }),
//     });

//     return response.json();
//   }

  async getChannelHistory(
    channel_id: string,
    limit: number = 30,
  ): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      limit: limit.toString(),
    });

    const response = await fetch(
      `https://slack.com/api/conversations.history?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }

  async getThreadReplies(channel_id: string, thread_ts: string): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      ts: thread_ts,
    });

    const response = await fetch(
      `https://slack.com/api/conversations.replies?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }

  async getUsers(limit: number = 1000, cursor?: string): Promise<any> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 1000).toString(),
      team_id: process.env.SLACK_TEAM_ID!,
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(`https://slack.com/api/users.list?${params}`, {
      headers: this.botHeaders,
    });

    const apiResponse = await response.json();
    
    if (!apiResponse.ok) {
      throw new Error(`Slack API error: ${apiResponse.error}`);
    }

    // Filter and map users to only include active, non-bot users with essential fields
    const filteredUsers: SlackUser[] = apiResponse.members
      .filter((member: any) => 
        !member.is_bot && 
        !member.deleted && 
        member.id !== 'USLACKBOT' &&
        !member.is_app_user
      )
      .map((member: any) => ({
        id: member.id,
        name: member.name,
        real_name: member.real_name,
        title: member.profile?.title || '',
      }));

    return {
      ok: true,
      members: filteredUsers,
      response_metadata: { 
        next_cursor: apiResponse.response_metadata?.next_cursor || "" 
      },
    };
  }

  async getUserProfile(user_id: string): Promise<any> {
    const params = new URLSearchParams({
      user: user_id,
      include_labels: "true",
    });

    const response = await fetch(
      `https://slack.com/api/users.profile.get?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }

//   async searchMessages(
//     query: string,
//     count: number = 20,
//     cursor?: string,
//     highlight: boolean = false,
//     page: number = 1,
//     sort: 'score' | 'timestamp' = 'score',
//     sort_dir: 'asc' | 'desc' = 'desc',
//   ): Promise<any> {
//     const params = new URLSearchParams({
//       query: query,
//       count: count.toString(),
//       highlight: highlight.toString(),
//       page: page.toString(),
//       sort: sort,
//       sort_dir: sort_dir,
//       team_id: process.env.SLACK_TEAM_ID!,
//     });

//     if (cursor) {
//       params.append("cursor", cursor);
//     }

//     const response = await fetch(
//       `https://slack.com/api/search.messages?${params}`,
//       { headers: this.userHeaders },
//     );

//     const apiResponse = await response.json();
    
//     if (!apiResponse.ok) {
//       if (apiResponse.error === 'missing_scope') {
//         throw new Error(`Slack API error: User token missing 'search:read' scope. Please ensure SLACK_USER_TOKEN has proper permissions.`);
//       }
//       throw new Error(`Slack API error: ${apiResponse.error}`);
//     }

//     // Limit to first 10 matches and return only metadata
//     const limitedMatches = apiResponse.messages?.matches?.slice(0, 10).map((match: any) => ({
//       type: match.type,
//       user: match.user,
//       username: match.username,
//       ts: match.ts,
//       channel: {
//         id: match.channel?.id,
//         name: match.channel?.name,
//       },
//       text: match.text,
//       permalink: match.permalink,
//       score: match.score,
//     })) || [];

//     return {
//       ok: apiResponse.ok,
//       query: apiResponse.query,
//       total: Math.min(apiResponse.messages?.total || 0, 10),
//       pagination: apiResponse.messages?.pagination,
//       matches: limitedMatches,
//     };
  // }
}



async function main() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const userToken = process.env.SLACK_USER_TOKEN;
  const teamId = process.env.SLACK_TEAM_ID;

  if (!botToken || !teamId) {
    console.error(
      "Please set SLACK_BOT_TOKEN and SLACK_TEAM_ID environment variables",
    );
    process.exit(1);
  }

  if (!userToken) {
    console.warn(
      "Warning: SLACK_USER_TOKEN not set. Search functionality may not work properly.",
    );
  }

  console.error("Starting Slack MCP Server...");
  const server = new Server(
    {
      name: "Slack MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const slackClient = new SlackClient(botToken, userToken);

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        switch (request.params.name) {
          case "slack_list_channels": {
            const args = request.params
              .arguments as unknown as ListChannelsArgs;
            const response = await slackClient.getChannels(
              args.cursor,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

        //   case "slack_post_message": {
        //     const args = request.params.arguments as unknown as PostMessageArgs;
        //     if (!args.channel_id || !args.text) {
        //       throw new Error(
        //         "Missing required arguments: channel_id and text",
        //       );
        //     }
        //     const response = await slackClient.postMessage(
        //       args.channel_id,
        //       args.text,
        //     );
        //     return {
        //       content: [{ type: "text", text: JSON.stringify(response) }],
        //     };
        //   }

        //   case "slack_reply_to_thread": {
        //     const args = request.params
        //       .arguments as unknown as ReplyToThreadArgs;
        //     if (!args.channel_id || !args.thread_ts || !args.text) {
        //       throw new Error(
        //         "Missing required arguments: channel_id, thread_ts, and text",
        //       );
        //     }
        //     const response = await slackClient.postReply(
        //       args.channel_id,
        //       args.thread_ts,
        //       args.text,
        //     );
        //     return {
        //       content: [{ type: "text", text: JSON.stringify(response) }],
        //     };
        //   }

        //   case "slack_add_reaction": {
        //     const args = request.params.arguments as unknown as AddReactionArgs;
        //     if (!args.channel_id || !args.timestamp || !args.reaction) {
        //       throw new Error(
        //         "Missing required arguments: channel_id, timestamp, and reaction",
        //       );
        //     }
        //     const response = await slackClient.addReaction(
        //       args.channel_id,
        //       args.timestamp,
        //       args.reaction,
        //     );
        //     return {
        //       content: [{ type: "text", text: JSON.stringify(response) }],
        //     };
        //   }

          case "slack_get_channel_history": {
            const args = request.params
              .arguments as unknown as GetChannelHistoryArgs;
            if (!args.channel_id) {
              throw new Error("Missing required argument: channel_id");
            }
            const response = await slackClient.getChannelHistory(
              args.channel_id,
              args.limit,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_thread_replies": {
            const args = request.params
              .arguments as unknown as GetThreadRepliesArgs;
            if (!args.channel_id || !args.thread_ts) {
              throw new Error(
                "Missing required arguments: channel_id and thread_ts",
              );
            }
            const response = await slackClient.getThreadReplies(
              args.channel_id,
              args.thread_ts,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_users": {
            const args = request.params.arguments as unknown as GetUsersArgs;
            const response = await slackClient.getUsers(
              args.limit,
              args.cursor,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_user_profile": {
            const args = request.params
              .arguments as unknown as GetUserProfileArgs;
            if (!args.user_id) {
              throw new Error("Missing required argument: user_id");
            }
            const response = await slackClient.getUserProfile(args.user_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

        //   case "slack_search_messages": {
        //     const args = request.params
        //       .arguments as unknown as SearchMessagesArgs;
        //     if (!args.query) {
        //       throw new Error("Missing required argument: query");
        //     }
        //     const response = await slackClient.searchMessages(
        //       args.query,
        //       args.count,
        //       args.cursor,
        //       args.highlight,
        //       args.page,
        //       args.sort,
        //       args.sort_dir,
        //     );
        //     return {
        //       content: [{ type: "text", text: JSON.stringify(response) }],
        //     };
        //   }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: [
        listChannelsTool,
        // postMessageTool,
        // replyToThreadTool,
        // addReactionTool,
        getChannelHistoryTool,
        getThreadRepliesTool,
        getUsersTool,
        getUserProfileTool,
        // searchMessagesTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Slack MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
