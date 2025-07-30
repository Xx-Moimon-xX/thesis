#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Type definitions for tool arguments
interface SearchSpotifyArgs { query: string; type: string; limit?: number; }
interface GetNowPlayingArgs {}
interface PlayMusicArgs { uri?: string; type?: string; id?: string; deviceId?: string; }
interface PausePlaybackArgs { deviceId?: string; }
interface SkipToNextArgs { deviceId?: string; }
interface SkipToPreviousArgs { deviceId?: string; }
interface CreatePlaylistArgs { name: string; description?: string; public?: boolean; }
interface AddTracksToPlaylistArgs { playlistId: string; trackUris: string[]; position?: number; }
interface GetUserPlaylistsArgs {}
interface GetPlaylistTracksArgs { playlistId: string; limit?: number; offset?: number; }
interface GetAlbumsArgs { albumIds: string[]; }
interface GetAlbumTracksArgs { albumId: string; limit?: number; offset?: number; }

// Tool type with call method
interface ToolWithCall extends Tool {
  call: (args: unknown) => Promise<any>;
}

class SpotifyClient {
  async search(args: SearchSpotifyArgs) {
    return { items: [{ id: "1", name: "Mock Song", type: args.type, artist: "Mock Artist" }] };
  }
  async getNowPlaying(_args: GetNowPlayingArgs) {
    return { track: "Mock Song", artist: "Mock Artist", album: "Mock Album", progress: 42, duration: 180 };
  }
  async playMusic(args: PlayMusicArgs) {
    return { status: "playing", uri: args.uri || null, type: args.type || null, id: args.id || null };
  }
  async pausePlayback(_args: PausePlaybackArgs) {
    return { status: "paused" };
  }
  async skipToNext(_args: SkipToNextArgs) {
    return { status: "skipped to next" };
  }
  async skipToPrevious(_args: SkipToPreviousArgs) {
    return { status: "skipped to previous" };
  }
  async createPlaylist(args: CreatePlaylistArgs) {
    return { id: "mock_playlist_id", url: "https://open.spotify.com/playlist/mock_playlist_id", name: args.name, description: args.description || "", public: args.public || false };
  }
  async addTracksToPlaylist(args: AddTracksToPlaylistArgs) {
    return { playlistId: args.playlistId, trackUris: args.trackUris, status: "tracks added" };
  }
  async getUserPlaylists(_args: GetUserPlaylistsArgs) {
    return { playlists: [{ id: "playlist_1", name: "Mock Playlist" }] };
  }
  async getPlaylistTracks(args: GetPlaylistTracksArgs) {
    return { playlistId: args.playlistId, tracks: [{ id: "track_1", name: "Mock Track" }] };
  }
  async getAlbums(args: GetAlbumsArgs) {
    return { albums: [{ id: "album_1", name: "Mock Album", artist: "Mock Artist" }] };
  }
  async getAlbumTracks(args: GetAlbumTracksArgs) {
    return { albumId: args.albumId, tracks: [{ id: "track_1", name: "Mock Album Track" }] };
  }
}

async function main() {
  const spotifyClient = new SpotifyClient();
  
  // Tool implementations with call methods
  const tools: ToolWithCall[] = [
    {
      name: "spotify_search",
      description: "Search for tracks, albums, artists, or playlists on Spotify",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          type: { 
            type: "string",
            enum: ["track", "album", "artist", "playlist"] 
          },
          limit: { type: "number", minimum: 1, maximum: 50 },
        },
        required: ["query", "type"],
      },
      call: async (args: unknown) => {
        return spotifyClient.search(args as SearchSpotifyArgs);
      }
    },
    {
      name: "spotify_get_now_playing",
      description: "Get information about the currently playing track on Spotify",
      inputSchema: { type: "object", properties: {} },
      call: async () => spotifyClient.getNowPlaying({})
    },
    {
      name: "spotify_play_music",
      description: "Play a track, album, or playlist on Spotify",
      inputSchema: {
        type: "object",
        properties: {
          uri: { type: "string" },
          deviceId: { type: "string" },
        },
      },
      call: async (args: unknown) => spotifyClient.playMusic(args as PlayMusicArgs)
    },
    {
      name: "spotify_pause_playback",
      description: "Pause the currently playing track on Spotify",
      inputSchema: {
        type: "object",
        properties: { deviceId: { type: "string" } },
      },
      call: async (args: unknown) => spotifyClient.pausePlayback(args as PausePlaybackArgs)
    },
    {
      name: "spotify_skip_to_next",
      description: "Skip to the next track in the current playback queue",
      inputSchema: {
        type: "object",
        properties: { deviceId: { type: "string" } },
      },
      call: async (args: unknown) => spotifyClient.skipToNext(args as SkipToNextArgs)
    },
    {
      name: "spotify_skip_to_previous",
      description: "Skip to the previous track in the current playback queue",
      inputSchema: {
        type: "object",
        properties: { deviceId: { type: "string" } },
      },
      call: async (args: unknown) => spotifyClient.skipToPrevious(args as SkipToPreviousArgs)
    },
    {
      name: "spotify_create_playlist",
      description: "Create a new playlist on Spotify",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          description: { type: "string" },
          public: { type: "boolean" },
        },
        required: ["name"],
      },
      call: async (args: unknown) => spotifyClient.createPlaylist(args as CreatePlaylistArgs)
    },
    {
      name: "spotify_add_tracks_to_playlist",
      description: "Add tracks to an existing Spotify playlist",
      inputSchema: {
        type: "object",
        properties: {
          playlistId: { type: "string", minLength: 1 },
          trackUris: { 
            type: "array", 
            items: { type: "string" },
            minItems: 1
          },
          position: { type: "number", minimum: 0 },
        },
        required: ["playlistId", "trackUris"],
      },
      call: async (args: unknown) => spotifyClient.addTracksToPlaylist(args as AddTracksToPlaylistArgs)
    },
    {
      name: "spotify_get_user_playlists",
      description: "Get the user's playlists",
      inputSchema: { type: "object", properties: {} },
      call: async () => spotifyClient.getUserPlaylists({})
    },
    {
      name: "spotify_get_playlist_tracks",
      description: "Get tracks from a playlist",
      inputSchema: {
        type: "object",
        properties: {
          playlistId: { type: "string", minLength: 1 },
          limit: { type: "number", minimum: 1, maximum: 100 },
          offset: { type: "number", minimum: 0 },
        },
        required: ["playlistId"],
      },
      call: async (args: unknown) => spotifyClient.getPlaylistTracks(args as GetPlaylistTracksArgs)
    },
    {
      name: "spotify_get_albums",
      description: "Get detailed information about one or more albums by their Spotify IDs",
      inputSchema: {
        type: "object",
        properties: { 
          albumIds: { 
            type: "array", 
            items: { type: "string", minLength: 1 },
            minItems: 1,
            maxItems: 20
          } 
        },
        required: ["albumIds"],
      },
      call: async (args: unknown) => spotifyClient.getAlbums(args as GetAlbumsArgs)
    },
    {
      name: "spotify_get_album_tracks",
      description: "Get tracks from a specific album",
      inputSchema: {
        type: "object",
        properties: {
          albumId: { type: "string", minLength: 1 },
          limit: { type: "number", minimum: 1, maximum: 50 },
          offset: { type: "number", minimum: 0 },
        },
        required: ["albumId"],
      },
      call: async (args: unknown) => spotifyClient.getAlbumTracks(args as GetAlbumTracksArgs)
    }
  ];

  // Create server with proper capabilities declaration
  const server = new Server(
    { 
      name: "Spotify Mock MCP Server", 
      version: "1.0.0" 
    },
    { 
      capabilities: { 
        tools: {
          enabled: true,
          tools: tools
        } 
      } 
    }
  );

  // Unified tool calling handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const tool = tools.find(t => t.name === request.params.name) as ToolWithCall | undefined;
      if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);
      
      const result = await tool.call(request.params.arguments);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify(result) 
        }] 
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            error: error instanceof Error ? error.message : String(error) 
          }),
        }],
      };
    }
  });

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Spotify Mock MCP Server running on stdio");
}

main().catch((error) => {
  console.error("🚨 Fatal error:", error);
  process.exit(1);
});