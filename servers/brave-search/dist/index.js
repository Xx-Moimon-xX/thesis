#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var WEB_SEARCH_TOOL = {
    name: "brave_web_search",
    description: "Performs a web search using the Brave Search API, ideal for general queries, news, articles, and online content. " +
        "Use this for broad information gathering, recent events, or when you need diverse web sources. " +
        "Supports pagination, content filtering, and freshness controls. " +
        "Maximum 20 results per request, with offset for pagination. ",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query (max 400 chars, 50 words)"
            },
            count: {
                type: "number",
                description: "Number of results (1-20, default 10)",
                default: 10
            },
            offset: {
                type: "number",
                description: "Pagination offset (max 9, default 0)",
                default: 0
            },
        },
        required: ["query"],
    },
};
var LOCAL_SEARCH_TOOL = {
    name: "brave_local_search",
    description: "Searches for local businesses and places using Brave's Local Search API. " +
        "Best for queries related to physical locations, businesses, restaurants, services, etc. " +
        "Returns detailed information including:\n" +
        "- Business names and addresses\n" +
        "- Ratings and review counts\n" +
        "- Phone numbers and opening hours\n" +
        "Use this when the query implies 'near me' or mentions specific locations. " +
        "Automatically falls back to web search if no local results are found.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Local search query (e.g. 'pizza near Central Park')"
            },
            count: {
                type: "number",
                description: "Number of results (1-20, default 5)",
                default: 5
            },
        },
        required: ["query"]
    }
};
// Server implementation
var server = new index_js_1.Server({
    name: "example-servers/brave-search",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Check for API key
var BRAVE_API_KEY = process.env.BRAVE_API_KEY;
if (!BRAVE_API_KEY) {
    console.error("Error: BRAVE_API_KEY environment variable is required");
    process.exit(1);
}
var RATE_LIMIT = {
    perSecond: 1,
    perMonth: 15000
};
var requestCount = {
    second: 0,
    month: 0,
    lastReset: Date.now()
};
function checkRateLimit() {
    var now = Date.now();
    if (now - requestCount.lastReset > 1000) {
        requestCount.second = 0;
        requestCount.lastReset = now;
    }
    if (requestCount.second >= RATE_LIMIT.perSecond ||
        requestCount.month >= RATE_LIMIT.perMonth) {
        throw new Error('Rate limit exceeded');
    }
    requestCount.second++;
    requestCount.month++;
}
function isBraveWebSearchArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof args.query === "string");
}
function isBraveLocalSearchArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof args.query === "string");
}
function performWebSearch(query_1) {
    return __awaiter(this, arguments, void 0, function (query, count, offset) {
        var url, response, _a, _b, _c, data, results;
        var _d;
        if (count === void 0) { count = 10; }
        if (offset === void 0) { offset = 0; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    checkRateLimit();
                    url = new URL('https://api.search.brave.com/res/v1/web/search');
                    url.searchParams.set('q', query);
                    url.searchParams.set('count', Math.min(count, 20).toString()); // API limit
                    url.searchParams.set('offset', offset.toString());
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                'Accept': 'application/json',
                                'Accept-Encoding': 'gzip',
                                'X-Subscription-Token': BRAVE_API_KEY
                            }
                        })];
                case 1:
                    response = _e.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    _a = Error.bind;
                    _c = (_b = "Brave API error: ".concat(response.status, " ").concat(response.statusText, "\n")).concat;
                    return [4 /*yield*/, response.text()];
                case 2: throw new (_a.apply(Error, [void 0, _c.apply(_b, [_e.sent()])]))();
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _e.sent();
                    results = (((_d = data.web) === null || _d === void 0 ? void 0 : _d.results) || []).map(function (result) { return ({
                        title: result.title || '',
                        description: result.description || '',
                        url: result.url || ''
                    }); });
                    return [2 /*return*/, results.map(function (r) {
                            return "Title: ".concat(r.title, "\nDescription: ").concat(r.description, "\nURL: ").concat(r.url);
                        }).join('\n\n')];
            }
        });
    });
}
function performLocalSearch(query_1) {
    return __awaiter(this, arguments, void 0, function (query, count) {
        var webUrl, webResponse, _a, _b, _c, webData, locationIds, _d, poisData, descriptionsData;
        var _e, _f;
        if (count === void 0) { count = 5; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    checkRateLimit();
                    webUrl = new URL('https://api.search.brave.com/res/v1/web/search');
                    webUrl.searchParams.set('q', query);
                    webUrl.searchParams.set('search_lang', 'en');
                    webUrl.searchParams.set('result_filter', 'locations');
                    webUrl.searchParams.set('count', Math.min(count, 20).toString());
                    return [4 /*yield*/, fetch(webUrl, {
                            headers: {
                                'Accept': 'application/json',
                                'Accept-Encoding': 'gzip',
                                'X-Subscription-Token': BRAVE_API_KEY
                            }
                        })];
                case 1:
                    webResponse = _g.sent();
                    if (!!webResponse.ok) return [3 /*break*/, 3];
                    _a = Error.bind;
                    _c = (_b = "Brave API error: ".concat(webResponse.status, " ").concat(webResponse.statusText, "\n")).concat;
                    return [4 /*yield*/, webResponse.text()];
                case 2: throw new (_a.apply(Error, [void 0, _c.apply(_b, [_g.sent()])]))();
                case 3: return [4 /*yield*/, webResponse.json()];
                case 4:
                    webData = _g.sent();
                    locationIds = ((_f = (_e = webData.locations) === null || _e === void 0 ? void 0 : _e.results) === null || _f === void 0 ? void 0 : _f.filter(function (r) { return r.id != null; }).map(function (r) { return r.id; })) || [];
                    if (locationIds.length === 0) {
                        return [2 /*return*/, performWebSearch(query, count)]; // Fallback to web search
                    }
                    return [4 /*yield*/, Promise.all([
                            getPoisData(locationIds),
                            getDescriptionsData(locationIds)
                        ])];
                case 5:
                    _d = _g.sent(), poisData = _d[0], descriptionsData = _d[1];
                    return [2 /*return*/, formatLocalResults(poisData, descriptionsData)];
            }
        });
    });
}
function getPoisData(ids) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, _a, _b, _c, poisResponse;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    checkRateLimit();
                    url = new URL('https://api.search.brave.com/res/v1/local/pois');
                    ids.filter(Boolean).forEach(function (id) { return url.searchParams.append('ids', id); });
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                'Accept': 'application/json',
                                'Accept-Encoding': 'gzip',
                                'X-Subscription-Token': BRAVE_API_KEY
                            }
                        })];
                case 1:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    _a = Error.bind;
                    _c = (_b = "Brave API error: ".concat(response.status, " ").concat(response.statusText, "\n")).concat;
                    return [4 /*yield*/, response.text()];
                case 2: throw new (_a.apply(Error, [void 0, _c.apply(_b, [_d.sent()])]))();
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    poisResponse = _d.sent();
                    return [2 /*return*/, poisResponse];
            }
        });
    });
}
function getDescriptionsData(ids) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, _a, _b, _c, descriptionsData;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    checkRateLimit();
                    url = new URL('https://api.search.brave.com/res/v1/local/descriptions');
                    ids.filter(Boolean).forEach(function (id) { return url.searchParams.append('ids', id); });
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                'Accept': 'application/json',
                                'Accept-Encoding': 'gzip',
                                'X-Subscription-Token': BRAVE_API_KEY
                            }
                        })];
                case 1:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    _a = Error.bind;
                    _c = (_b = "Brave API error: ".concat(response.status, " ").concat(response.statusText, "\n")).concat;
                    return [4 /*yield*/, response.text()];
                case 2: throw new (_a.apply(Error, [void 0, _c.apply(_b, [_d.sent()])]))();
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    descriptionsData = _d.sent();
                    return [2 /*return*/, descriptionsData];
            }
        });
    });
}
function formatLocalResults(poisData, descData) {
    return (poisData.results || []).map(function (poi) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        var address = [
            (_b = (_a = poi.address) === null || _a === void 0 ? void 0 : _a.streetAddress) !== null && _b !== void 0 ? _b : '',
            (_d = (_c = poi.address) === null || _c === void 0 ? void 0 : _c.addressLocality) !== null && _d !== void 0 ? _d : '',
            (_f = (_e = poi.address) === null || _e === void 0 ? void 0 : _e.addressRegion) !== null && _f !== void 0 ? _f : '',
            (_h = (_g = poi.address) === null || _g === void 0 ? void 0 : _g.postalCode) !== null && _h !== void 0 ? _h : ''
        ].filter(function (part) { return part !== ''; }).join(', ') || 'N/A';
        return "Name: ".concat(poi.name, "\nAddress: ").concat(address, "\nPhone: ").concat(poi.phone || 'N/A', "\nRating: ").concat((_k = (_j = poi.rating) === null || _j === void 0 ? void 0 : _j.ratingValue) !== null && _k !== void 0 ? _k : 'N/A', " (").concat((_m = (_l = poi.rating) === null || _l === void 0 ? void 0 : _l.ratingCount) !== null && _m !== void 0 ? _m : 0, " reviews)\nPrice Range: ").concat(poi.priceRange || 'N/A', "\nHours: ").concat((poi.openingHours || []).join(', ') || 'N/A', "\nDescription: ").concat(descData.descriptions[poi.id] || 'No description available', "\n");
    }).join('\n---\n') || 'No local results found';
}
// Tool handlers
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
                tools: [WEB_SEARCH_TOOL, LOCAL_SEARCH_TOOL],
            })];
    });
}); });
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, args, _b, query, _c, count, results, query, _d, count, results, error_1;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 7, , 8]);
                _a = request.params, name_1 = _a.name, args = _a.arguments;
                if (!args) {
                    throw new Error("No arguments provided");
                }
                _b = name_1;
                switch (_b) {
                    case "brave_web_search": return [3 /*break*/, 1];
                    case "brave_local_search": return [3 /*break*/, 3];
                }
                return [3 /*break*/, 5];
            case 1:
                if (!isBraveWebSearchArgs(args)) {
                    throw new Error("Invalid arguments for brave_web_search");
                }
                query = args.query, _c = args.count, count = _c === void 0 ? 10 : _c;
                return [4 /*yield*/, performWebSearch(query, count)];
            case 2:
                results = _e.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: results }],
                        isError: false,
                    }];
            case 3:
                if (!isBraveLocalSearchArgs(args)) {
                    throw new Error("Invalid arguments for brave_local_search");
                }
                query = args.query, _d = args.count, count = _d === void 0 ? 5 : _d;
                return [4 /*yield*/, performLocalSearch(query, count)];
            case 4:
                results = _e.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: results }],
                        isError: false,
                    }];
            case 5: return [2 /*return*/, {
                    content: [{ type: "text", text: "Unknown tool: ".concat(name_1) }],
                    isError: true,
                }];
            case 6: return [3 /*break*/, 8];
            case 7:
                error_1 = _e.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)),
                            },
                        ],
                        isError: true,
                    }];
            case 8: return [2 /*return*/];
        }
    });
}); });
function runServer() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.error("Brave Search MCP Server running on stdio");
                    return [2 /*return*/];
            }
        });
    });
}
runServer().catch(function (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
