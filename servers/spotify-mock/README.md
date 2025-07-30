# Spotify Mock MCP Server

This is a mock Model Context Protocol (MCP) server for Spotify. It simulates the endpoints and tool manifest of a real Spotify MCP server, but does not call any real APIs or external services.

## Endpoints

- `GET /tools` — Lists available tools and their schemas
- `POST /searchSpotify` — Returns mock search results for Spotify
- `POST /getNowPlaying` — Returns mock now playing info
- `POST /playMusic` — Simulates playing music
- `POST /pausePlayback` — Simulates pausing playback
- `POST /skipToNext` — Simulates skipping to next track
- `POST /createPlaylist` — Simulates creating a playlist

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

The server will listen on port 8001 by default.

## Tool Manifest Example

See `/tools` endpoint for the current tool manifest.

---
This server is for development and testing only. It does not interact with the real Spotify API. 