#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
class SpotifyClient {
    async search(args) {
        return { items: [{ id: "1", name: "Mock Song", type: args.type, artist: "Mock Artist" }] };
    }
    async getNowPlaying(_args) {
        return { track: "Mock Song", artist: "Mock Artist", album: "Mock Album", progress: 42, duration: 180 };
    }
    async playMusic(args) {
        return { status: "playing", uri: args.uri || null, type: args.type || null, id: args.id || null };
    }
    async pausePlayback(_args) {
        return { status: "paused" };
    }
    async skipToNext(_args) {
        return { status: "skipped to next" };
    }
    async skipToPrevious(_args) {
        return { status: "skipped to previous" };
    }
    async createPlaylist(args) {
        return { id: "mock_playlist_id", url: "https://open.spotify.com/playlist/mock_playlist_id", name: args.name, description: args.description || "", public: args.public || false };
    }
    async addTracksToPlaylist(args) {
        return { playlistId: args.playlistId, trackUris: args.trackUris, status: "tracks added" };
    }
    async getUserPlaylists(_args) {
        return { playlists: [{ id: "playlist_1", name: "Mock Playlist" }] };
    }
    async getPlaylistTracks(args) {
        return { playlistId: args.playlistId, tracks: [{ id: "track_1", name: "Mock Track" }] };
    }
    async getAlbums(args) {
        return { albums: [{ id: "album_1", name: "Mock Album", artist: "Mock Artist" }] };
    }
    async getAlbumTracks(args) {
        return { albumId: args.albumId, tracks: [{ id: "track_1", name: "Mock Album Track" }] };
    }
}
async function main() {
    const spotifyClient = new SpotifyClient();
    // Tool implementations with call methods
    const tools = [
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
            call: async (args) => {
                return spotifyClient.search(args);
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
            call: async (args) => spotifyClient.playMusic(args)
        },
        {
            name: "spotify_pause_playback",
            description: "Pause the currently playing track on Spotify",
            inputSchema: {
                type: "object",
                properties: { deviceId: { type: "string" } },
            },
            call: async (args) => spotifyClient.pausePlayback(args)
        },
        {
            name: "spotify_skip_to_next",
            description: "Skip to the next track in the current playback queue",
            inputSchema: {
                type: "object",
                properties: { deviceId: { type: "string" } },
            },
            call: async (args) => spotifyClient.skipToNext(args)
        },
        {
            name: "spotify_skip_to_previous",
            description: "Skip to the previous track in the current playback queue",
            inputSchema: {
                type: "object",
                properties: { deviceId: { type: "string" } },
            },
            call: async (args) => spotifyClient.skipToPrevious(args)
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
            call: async (args) => spotifyClient.createPlaylist(args)
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
            call: async (args) => spotifyClient.addTracksToPlaylist(args)
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
            call: async (args) => spotifyClient.getPlaylistTracks(args)
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
            call: async (args) => spotifyClient.getAlbums(args)
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
            call: async (args) => spotifyClient.getAlbumTracks(args)
        }
    ];
    // Create server with proper capabilities declaration
    const server = new Server({
        name: "Spotify Mock MCP Server",
        version: "1.0.0"
    }, {
        capabilities: {
            tools: {
                enabled: true,
                tools: tools
            }
        }
    });
    // Unified tool calling handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const tool = tools.find(t => t.name === request.params.name);
            if (!tool)
                throw new Error(`Unknown tool: ${request.params.name}`);
            const result = await tool.call(request.params.arguments);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result)
                    }]
            };
        }
        catch (error) {
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
