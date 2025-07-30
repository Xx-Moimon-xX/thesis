# Notion Mock MCP Server

This is a mock Model Context Protocol (MCP) server for Notion. It simulates the endpoints and tool manifest of a real Notion MCP server, but does not call any real APIs or external services.

## Endpoints

- `GET /tools` — Lists available tools and their schemas
- `POST /searchPages` — Returns mock search results for Notion pages
- `POST /getPage` — Returns a mock Notion page by ID
- `POST /createPage` — Simulates creating a Notion page
- `POST /updatePage` — Simulates updating a Notion page

## Usage

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run the server (development):
   ```sh
   npx ts-node index.ts
   ```
   Or build and run:
   ```sh
   npm run build
   node dist/index.js
   ```

The server will listen on port 8002 by default.

## Tool Manifest Example

See `/tools` endpoint for the current tool manifest.

---
This server is for development and testing only. It does not interact with the real Notion API. 