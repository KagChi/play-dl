"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlaylist = exports.parseVideo = exports.parseChannel = exports.ParseSearchResult = void 0;
const Video_1 = require("../classes/Video");
const Playlist_1 = require("../classes/Playlist");
const Channel_1 = require("../classes/Channel");
function ParseSearchResult(html, options) {
    if (!html)
        throw new Error('Can\'t parse Search result without data');
    if (!options)
        options = { type: "video", limit: 0 };
    if (!options.type)
        options.type = "video";
    let data = html.split("var ytInitialData = ")[1].split("}};")[0] + '}}';
    let json_data = JSON.parse(data);
    let results = [];
    let details = json_data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    for (let i = 0; i < details.length; i++) {
        if (typeof options.limit === "number" && options.limit > 0 && results.length >= options.limit)
            break;
        if (options.type === "video") {
            const parsed = parseVideo(details[i]);
            if (!parsed)
                continue;
            results.push(parsed);
        }
        else if (options.type === "channel") {
            const parsed = parseChannel(details[i]);
            if (!parsed)
                continue;
            results.push(parsed);
        }
        else if (options.type === "playlist") {
            const parsed = parsePlaylist(details[i]);
            if (!parsed)
                continue;
            results.push(parsed);
        }
    }
    return results;
}
exports.ParseSearchResult = ParseSearchResult;
function parseDuration(duration) {
    duration !== null && duration !== void 0 ? duration : (duration = "0:00");
    const args = duration.split(":");
    let dur = 0;
    switch (args.length) {
        case 3:
            dur = parseInt(args[0]) * 60 * 60 + parseInt(args[1]) * 60 + parseInt(args[2]);
            break;
        case 2:
            dur = parseInt(args[0]) * 60 + parseInt(args[1]);
            break;
        default:
            dur = parseInt(args[0]);
    }
    return dur;
}
function parseChannel(data) {
    var _a, _b, _c;
    if (!data || !data.channelRenderer)
        return;
    const badge = data.channelRenderer.ownerBadges && data.channelRenderer.ownerBadges[0];
    let url = `https://www.youtube.com${data.channelRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl || data.channelRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url}`;
    let res = new Channel_1.Channel({
        id: data.channelRenderer.channelId,
        name: data.channelRenderer.title.simpleText,
        icon: {
            url: data.channelRenderer.thumbnail.thumbnails[data.channelRenderer.thumbnail.thumbnails.length - 1].url.replace('//', 'https://'),
            width: data.channelRenderer.thumbnail.thumbnails[data.channelRenderer.thumbnail.thumbnails.length - 1].width,
            height: data.channelRenderer.thumbnail.thumbnails[data.channelRenderer.thumbnail.thumbnails.length - 1].height
        },
        url: url,
        verified: Boolean((_b = (_a = badge === null || badge === void 0 ? void 0 : badge.metadataBadgeRenderer) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("verified")),
        subscribers: ((_c = data.channelRenderer.subscriberCountText) === null || _c === void 0 ? void 0 : _c.simpleText) ? data.channelRenderer.subscriberCountText.simpleText : '0 subscribers'
    });
    return res;
}
exports.parseChannel = parseChannel;
function parseVideo(data) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!data || !data.videoRenderer)
        return;
    const badge = data.videoRenderer.ownerBadges && data.videoRenderer.ownerBadges[0];
    let res = new Video_1.Video({
        id: data.videoRenderer.videoId,
        url: `https://www.youtube.com/watch?v=${data.videoRenderer.videoId}`,
        title: data.videoRenderer.title.runs[0].text,
        description: data.videoRenderer.descriptionSnippet && data.videoRenderer.descriptionSnippet.runs[0] ? data.videoRenderer.descriptionSnippet.runs[0].text : "",
        duration: data.videoRenderer.lengthText ? parseDuration(data.videoRenderer.lengthText.simpleText) : 0,
        duration_raw: data.videoRenderer.lengthText ? data.videoRenderer.lengthText.simpleText : null,
        thumbnail: data.videoRenderer.thumbnail.thumbnails[data.videoRenderer.thumbnail.thumbnails.length - 1],
        channel: {
            id: data.videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId || null,
            name: data.videoRenderer.ownerText.runs[0].text || null,
            url: `https://www.youtube.com${data.videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl || data.videoRenderer.ownerText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
            icon: {
                url: data.videoRenderer.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url,
                width: data.videoRenderer.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].width,
                height: data.videoRenderer.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].height
            },
            verified: Boolean((_b = (_a = badge === null || badge === void 0 ? void 0 : badge.metadataBadgeRenderer) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("verified"))
        },
        uploadedAt: (_d = (_c = data.videoRenderer.publishedTimeText) === null || _c === void 0 ? void 0 : _c.simpleText) !== null && _d !== void 0 ? _d : null,
        views: (_g = (_f = (_e = data.videoRenderer.viewCountText) === null || _e === void 0 ? void 0 : _e.simpleText) === null || _f === void 0 ? void 0 : _f.replace(/[^0-9]/g, "")) !== null && _g !== void 0 ? _g : 0,
        live: data.videoRenderer.lengthText ? false : true,
    });
    return res;
}
exports.parseVideo = parseVideo;
function parsePlaylist(data) {
    if (!data.playlistRenderer)
        return;
    const res = new Playlist_1.PlayList({
        id: data.playlistRenderer.playlistId,
        title: data.playlistRenderer.title.simpleText,
        thumbnail: {
            id: data.playlistRenderer.playlistId,
            url: data.playlistRenderer.thumbnails[0].thumbnails[data.playlistRenderer.thumbnails[0].thumbnails.length - 1].url,
            height: data.playlistRenderer.thumbnails[0].thumbnails[data.playlistRenderer.thumbnails[0].thumbnails.length - 1].height,
            width: data.playlistRenderer.thumbnails[0].thumbnails[data.playlistRenderer.thumbnails[0].thumbnails.length - 1].width
        },
        channel: {
            id: data.playlistRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
            name: data.playlistRenderer.shortBylineText.runs[0].text,
            url: `https://www.youtube.com${data.playlistRenderer.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`
        },
        videos: parseInt(data.playlistRenderer.videoCount.replace(/[^0-9]/g, ""))
    }, true);
    return res;
}
exports.parsePlaylist = parsePlaylist;
//# sourceMappingURL=parser.js.map