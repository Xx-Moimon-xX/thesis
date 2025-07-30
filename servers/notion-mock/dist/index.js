#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// Tool definitions
class NotionClient {
    async searchPages(args) {
        return { results: [{ id: "page_1", title: "Mock Notion Page", content: "This is a mock page." }] };
    }
    async getPage(args) {
        return { id: args.pageId, title: "Mock Notion Page", content: "This is a mock page." };
    }
    async createPage(args) {
        return { id: "new_page_id", title: args.title, content: args.content, status: "created" };
    }
    async updatePage(args) {
        return { id: args.pageId, content: args.content, status: "updated" };
    }
    async deletePage(args) {
        return { id: args.pageId, status: "deleted" };
    }
    async listDatabases(_args) {
        return { databases: [{ id: "db_1", name: "Mock Database" }] };
    }
    async getDatabase(args) {
        return { id: args.databaseId, name: "Mock Database", schema: { title: "string", content: "string" } };
    }
    async createDatabase(args) {
        return { id: "new_db_id", name: args.name, schema: args.schema, status: "created" };
    }
    async updateDatabase(args) {
        return { id: args.databaseId, schema: args.schema, status: "updated" };
    }
    async addCommentToPage(args) {
        return { pageId: args.pageId, comment: args.comment, status: "comment added" };
    }
    async listCommentsOnPage(args) {
        return { pageId: args.pageId, comments: [{ id: "comment_1", text: "Mock comment" }] };
    }
    async duplicatePage(args) {
        return { originalId: args.pageId, newId: "duplicated_page_id", status: "duplicated" };
    }
}
const notionClient = new NotionClient();
const tools = [
    {
        name: "notion_search_pages",
        description: "Search Notion pages",
        inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
        },
        call: async (args) => notionClient.searchPages(args),
    },
    {
        name: "notion_get_page",
        description: "Get a Notion page by ID",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" } },
            required: ["pageId"],
        },
        call: async (args) => notionClient.getPage(args),
    },
    {
        name: "notion_create_page",
        description: "Create a new Notion page",
        inputSchema: {
            type: "object",
            properties: { title: { type: "string" }, content: { type: "string" } },
            required: ["title", "content"],
        },
        call: async (args) => notionClient.createPage(args),
    },
    {
        name: "notion_update_page",
        description: "Update a Notion page",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" }, content: { type: "string" } },
            required: ["pageId", "content"],
        },
        call: async (args) => notionClient.updatePage(args),
    },
    {
        name: "notion_delete_page",
        description: "Delete a Notion page",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" } },
            required: ["pageId"],
        },
        call: async (args) => notionClient.deletePage(args),
    },
    {
        name: "notion_list_databases",
        description: "List all databases",
        inputSchema: { type: "object", properties: {} },
        call: async (args) => notionClient.listDatabases(args),
    },
    {
        name: "notion_get_database",
        description: "Get a database by ID",
        inputSchema: {
            type: "object",
            properties: { databaseId: { type: "string" } },
            required: ["databaseId"],
        },
        call: async (args) => notionClient.getDatabase(args),
    },
    {
        name: "notion_create_database",
        description: "Create a new database",
        inputSchema: {
            type: "object",
            properties: { name: { type: "string" }, schema: { type: "object" } },
            required: ["name", "schema"],
        },
        call: async (args) => notionClient.createDatabase(args),
    },
    {
        name: "notion_update_database",
        description: "Update a database",
        inputSchema: {
            type: "object",
            properties: { databaseId: { type: "string" }, schema: { type: "object" } },
            required: ["databaseId", "schema"],
        },
        call: async (args) => notionClient.updateDatabase(args),
    },
    {
        name: "notion_add_comment_to_page",
        description: "Add a comment to a page",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" }, comment: { type: "string" } },
            required: ["pageId", "comment"],
        },
        call: async (args) => notionClient.addCommentToPage(args),
    },
    {
        name: "notion_list_comments_on_page",
        description: "List comments on a page",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" } },
            required: ["pageId"],
        },
        call: async (args) => notionClient.listCommentsOnPage(args),
    },
    {
        name: "notion_duplicate_page",
        description: "Duplicate a Notion page",
        inputSchema: {
            type: "object",
            properties: { pageId: { type: "string" } },
            required: ["pageId"],
        },
        call: async (args) => notionClient.duplicatePage(args),
    },
];
async function main() {
    const server = new Server({ name: "Notion Mock MCP Server", version: "1.0.0" }, {
        capabilities: {
            tools: {
                enabled: true,
                tools: tools,
            },
        },
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const tool = tools.find((t) => t.name === request.params.name);
            if (!tool)
                throw new Error(`Unknown tool: ${request.params.name}`);
            const result = await tool.call(request.params.arguments);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
                    },
                ],
            };
        }
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Notion Mock MCP Server running on stdio");
}
main().catch((error) => {
    console.error("🚨 Fatal error in main():", error);
    process.exit(1);
});
