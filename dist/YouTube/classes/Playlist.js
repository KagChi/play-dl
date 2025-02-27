"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayList = void 0;
const extractor_1 = require("../utils/extractor");
const request_1 = require("../utils/request");
const BASE_API = "https://www.youtube.com/youtubei/v1/browse?key=";
class PlayList {
    constructor(data, searchResult = false) {
        this._continuation = {};
        if (!data)
            throw new Error(`Cannot instantiate the ${this.constructor.name} class without data!`);
        this.__count = 0;
        this.fetched_videos = new Map();
        if (searchResult)
            this.__patchSearch(data);
        else
            this.__patch(data);
    }
    __patch(data) {
        var _a, _b, _c, _d, _e, _f;
        this.id = data.id || undefined;
        this.url = data.url || undefined;
        this.title = data.title || undefined;
        this.videoCount = data.videoCount || 0;
        this.lastUpdate = data.lastUpdate || undefined;
        this.views = data.views || 0;
        this.link = data.link || undefined;
        this.channel = data.author || undefined;
        this.thumbnail = data.thumbnail || undefined;
        this.videos = data.videos || [];
        this.__count++;
        this.fetched_videos.set(`page${this.__count}`, this.videos);
        this._continuation.api = (_b = (_a = data.continuation) === null || _a === void 0 ? void 0 : _a.api) !== null && _b !== void 0 ? _b : undefined;
        this._continuation.token = (_d = (_c = data.continuation) === null || _c === void 0 ? void 0 : _c.token) !== null && _d !== void 0 ? _d : undefined;
        this._continuation.clientVersion = (_f = (_e = data.continuation) === null || _e === void 0 ? void 0 : _e.clientVersion) !== null && _f !== void 0 ? _f : "<important data>";
    }
    __patchSearch(data) {
        this.id = data.id || undefined;
        this.url = this.id ? `https://www.youtube.com/playlist?list=${this.id}` : undefined;
        this.title = data.title || undefined;
        this.thumbnail = data.thumbnail || undefined;
        this.channel = data.channel || undefined;
        this.videos = [];
        this.videoCount = data.videos || 0;
        this.link = undefined;
        this.lastUpdate = undefined;
        this.views = 0;
    }
    async next(limit = Infinity) {
        var _a, _b, _c;
        if (!this._continuation || !this._continuation.token)
            return [];
        let nextPage = await request_1.request(`${BASE_API}${this._continuation.api}`, {
            method: "POST",
            body: JSON.stringify({
                continuation: this._continuation.token,
                context: {
                    client: {
                        utcOffsetMinutes: 0,
                        gl: "US",
                        hl: "en",
                        clientName: "WEB",
                        clientVersion: this._continuation.clientVersion
                    },
                    user: {},
                    request: {}
                }
            })
        });
        let contents = (_c = (_b = (_a = JSON.parse(nextPage)) === null || _a === void 0 ? void 0 : _a.onResponseReceivedActions[0]) === null || _b === void 0 ? void 0 : _b.appendContinuationItemsAction) === null || _c === void 0 ? void 0 : _c.continuationItems;
        if (!contents)
            return [];
        let playlist_videos = extractor_1.getPlaylistVideos(contents, limit);
        this.fetched_videos.set(`page${this.__count}`, playlist_videos);
        this._continuation.token = extractor_1.getContinuationToken(contents);
        return playlist_videos;
    }
    async fetch(max = Infinity) {
        var _a;
        let continuation = this._continuation.token;
        if (!continuation)
            return this;
        if (max < 1)
            max = Infinity;
        while (typeof this._continuation.token === "string" && this._continuation.token.length) {
            if (((_a = this.videos) === null || _a === void 0 ? void 0 : _a.length) >= max)
                break;
            this.__count++;
            const res = await this.next();
            if (!res.length)
                break;
        }
        return this;
    }
    get type() {
        return "playlist";
    }
    page(number) {
        if (!number)
            throw new Error('Page number is not provided');
        if (!this.fetched_videos.has(`page${number}`))
            throw new Error('Given Page number is invalid');
        return this.fetched_videos.get(`page${number}`);
    }
    get total_pages() {
        return this.fetched_videos.size;
    }
    get total_videos() {
        let page_number = this.total_pages;
        return (page_number - 1) * 100 + this.fetched_videos.get(`page${page_number}`).length;
    }
    toJSON() {
        var _a, _b, _c;
        return {
            id: this.id,
            title: this.title,
            thumbnail: this.thumbnail,
            channel: {
                name: (_a = this.channel) === null || _a === void 0 ? void 0 : _a.name,
                id: (_b = this.channel) === null || _b === void 0 ? void 0 : _b.id,
                icon: (_c = this.channel) === null || _c === void 0 ? void 0 : _c.iconURL()
            },
            url: this.url,
            videos: this.videos
        };
    }
}
exports.PlayList = PlayList;
//# sourceMappingURL=Playlist.js.map