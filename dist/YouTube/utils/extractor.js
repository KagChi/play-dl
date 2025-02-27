"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContinuationToken = exports.getPlaylistVideos = exports.playlist_info = exports.video_info = exports.video_basic_info = exports.extractID = exports.yt_validate = void 0;
const request_1 = require("./request");
const axios_1 = __importDefault(require("axios"));
const Video_1 = require("../classes/Video");
const Playlist_1 = require("../classes/Playlist");
const DEFAULT_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const video_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
const playlist_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m)\.)?(youtube\.com)\/(?:(playlist|watch))(.*)?((\?|\&)list=)/;
function yt_validate(url) {
    if (url.indexOf('list=') === -1) {
        if (!url.match(video_pattern))
            return false;
        else
            return "video";
    }
    else {
        if (!url.match(playlist_pattern))
            return false;
        let Playlist_id = url.split('list=')[1].split('&')[0];
        if (Playlist_id.length !== 34 || !Playlist_id.startsWith('PL')) {
            return false;
        }
        return "playlist";
    }
}
exports.yt_validate = yt_validate;
function extractID(url) {
    if (url.startsWith('https')) {
        if (url.indexOf('list=') === -1) {
            let video_id;
            if (url.includes('youtu.be/'))
                video_id = url.split('youtu.be/')[1].split('/')[0];
            else if (url.includes('youtube.com/embed/'))
                video_id = url.split('youtube.com/embed/')[1].split('/')[0];
            else
                video_id = url.split('watch?v=')[1].split('&')[0];
            return video_id;
        }
        else {
            return url.split('list=')[1].split('&')[0];
        }
    }
    else
        return url;
}
exports.extractID = extractID;
async function video_basic_info(url, cookie) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let video_id;
    if (url.startsWith('https')) {
        if (yt_validate(url) !== 'video')
            throw new Error('This is not a YouTube Watch URL');
        video_id = extractID(url);
    }
    else
        video_id = url;
    let { data: dataJson } = await axios_1.default.post('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
        "context": {
            "client": {
                "clientName": "ANDROID",
                "clientVersion": "16.24"
            }
        },
        "videoId": video_id,
        "playbackContext": {
            "contentPlaybackContext": {
                "signatureTimestamp": 1
            }
        }
    });
    if (dataJson.playabilityStatus.status !== 'OK')
        throw new Error(`While getting info from url\n${(_b = (_a = dataJson.playabilityStatus.errorScreen.playerErrorMessageRenderer) === null || _a === void 0 ? void 0 : _a.reason.simpleText) !== null && _b !== void 0 ? _b : (_c = dataJson.playabilityStatus.errorScreen.playerKavRenderer) === null || _c === void 0 ? void 0 : _c.reason.simpleText}`);
    let format = [];
    let vid = dataJson.videoDetails;
    let microformat = (_d = dataJson.microformat) === null || _d === void 0 ? void 0 : _d.playerMicroformatRenderer;
    let video_details = {
        id: vid.videoId,
        url: `https://www.youtube.com/watch?v=${vid.videoId}`,
        title: vid.title,
        description: vid.shortDescription,
        durationInSec: vid.lengthSeconds,
        durationRaw: parseSeconds(vid.lengthSeconds),
        uploadedDate: microformat === null || microformat === void 0 ? void 0 : microformat.publishDate,
        thumbnail: vid.thumbnail.thumbnails[vid.thumbnail.thumbnails.length - 1],
        channel: {
            name: vid.author,
            id: vid.channelId,
            url: `https://www.youtube.com/channel/${vid.channelId}`,
            verified: null
        },
        views: vid.viewCount,
        tags: vid.keywords,
        averageRating: vid.averageRating,
        live: vid.isLiveContent,
        private: vid.isPrivate
    };
    if (!video_details.live)
        format.push(dataJson.streamingData.formats[0]);
    format.push(...dataJson.streamingData.adaptiveFormats);
    let LiveStreamData = {
        isLive: video_details.live,
        dashManifestUrl: (_f = (_e = dataJson.streamingData) === null || _e === void 0 ? void 0 : _e.dashManifestUrl) !== null && _f !== void 0 ? _f : null,
        hlsManifestUrl: (_h = (_g = dataJson.streamingData) === null || _g === void 0 ? void 0 : _g.hlsManifestUrl) !== null && _h !== void 0 ? _h : null
    };
    return {
        LiveStreamData,
        format,
        video_details
    };
}
exports.video_basic_info = video_basic_info;
function parseSeconds(seconds) {
    let d = Number(seconds);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    var hDisplay = h > 0 ? (h < 10 ? `0${h}` : h) + ':' : "";
    var mDisplay = m > 0 ? (m < 10 ? `0${m}` : m) + ':' : "00:";
    var sDisplay = s > 0 ? (s < 10 ? `0${s}` : s) : "00";
    return hDisplay + mDisplay + sDisplay;
}
async function video_info(url, cookie) {
    let data = await video_basic_info(url, cookie);
    if (data.LiveStreamData.isLive === true && data.LiveStreamData.hlsManifestUrl !== null) {
        return data;
    }
    else {
        return data;
    }
}
exports.video_info = video_info;
async function playlist_info(url, parseIncomplete = false) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (!url || typeof url !== "string")
        throw new Error(`Expected playlist url, received ${typeof url}!`);
    let Playlist_id;
    if (url.startsWith('https')) {
        if (yt_validate(url) !== 'playlist')
            throw new Error('This is not a Playlist URL');
        Playlist_id = extractID(url);
    }
    else
        Playlist_id = url;
    let new_url = `https://www.youtube.com/playlist?list=${Playlist_id}`;
    let body = await request_1.request(new_url, {
        headers: { 'accept-language': 'en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7' }
    });
    let response = JSON.parse(body.split("var ytInitialData = ")[1].split(";</script>")[0]);
    if (response.alerts) {
        if (((_a = response.alerts[0].alertWithButtonRenderer) === null || _a === void 0 ? void 0 : _a.type) === 'INFO') {
            if (!parseIncomplete)
                throw new Error(`While parsing playlist url\n${response.alerts[0].alertWithButtonRenderer.text.simpleText}`);
        }
        else if (((_b = response.alerts[0].alertRenderer) === null || _b === void 0 ? void 0 : _b.type) === 'ERROR')
            throw new Error(`While parsing playlist url\n${response.alerts[0].alertRenderer.text.runs[0].text}`);
        else
            throw new Error('While parsing playlist url\nUnknown Playlist Error');
    }
    let rawJSON = `${body.split('{"playlistVideoListRenderer":{"contents":')[1].split('}],"playlistId"')[0]}}]`;
    let parsed = JSON.parse(rawJSON);
    let playlistDetails = JSON.parse(body.split('{"playlistSidebarRenderer":')[1].split("}};</script>")[0]).items;
    let API_KEY = (_f = (_d = (_c = body.split('INNERTUBE_API_KEY":"')[1]) === null || _c === void 0 ? void 0 : _c.split('"')[0]) !== null && _d !== void 0 ? _d : (_e = body.split('innertubeApiKey":"')[1]) === null || _e === void 0 ? void 0 : _e.split('"')[0]) !== null && _f !== void 0 ? _f : DEFAULT_API_KEY;
    let videos = getPlaylistVideos(parsed, 100);
    let data = playlistDetails[0].playlistSidebarPrimaryInfoRenderer;
    if (!data.title.runs || !data.title.runs.length)
        return undefined;
    let author = (_g = playlistDetails[1]) === null || _g === void 0 ? void 0 : _g.playlistSidebarSecondaryInfoRenderer.videoOwner;
    let views = data.stats.length === 3 ? data.stats[1].simpleText.replace(/[^0-9]/g, "") : 0;
    let lastUpdate = (_k = (_j = (_h = data.stats.find((x) => "runs" in x && x["runs"].find((y) => y.text.toLowerCase().includes("last update")))) === null || _h === void 0 ? void 0 : _h.runs.pop()) === null || _j === void 0 ? void 0 : _j.text) !== null && _k !== void 0 ? _k : null;
    let videosCount = data.stats[0].runs[0].text.replace(/[^0-9]/g, "") || 0;
    let res = new Playlist_1.PlayList({
        continuation: {
            api: API_KEY,
            token: getContinuationToken(parsed),
            clientVersion: (_p = (_m = (_l = body.split('"INNERTUBE_CONTEXT_CLIENT_VERSION":"')[1]) === null || _l === void 0 ? void 0 : _l.split('"')[0]) !== null && _m !== void 0 ? _m : (_o = body.split('"innertube_context_client_version":"')[1]) === null || _o === void 0 ? void 0 : _o.split('"')[0]) !== null && _p !== void 0 ? _p : "<some version>"
        },
        id: data.title.runs[0].navigationEndpoint.watchEndpoint.playlistId,
        title: data.title.runs[0].text,
        videoCount: parseInt(videosCount) || 0,
        lastUpdate: lastUpdate,
        views: parseInt(views) || 0,
        videos: videos,
        url: `https://www.youtube.com/playlist?list=${data.title.runs[0].navigationEndpoint.watchEndpoint.playlistId}`,
        link: `https://www.youtube.com${data.title.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
        author: author
            ? {
                name: author.videoOwnerRenderer.title.runs[0].text,
                id: author.videoOwnerRenderer.title.runs[0].navigationEndpoint.browseEndpoint.browseId,
                url: `https://www.youtube.com${author.videoOwnerRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url || author.videoOwnerRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl}`,
                icon: author.videoOwnerRenderer.thumbnail.thumbnails.length ? author.videoOwnerRenderer.thumbnail.thumbnails[author.videoOwnerRenderer.thumbnail.thumbnails.length - 1].url : null
            }
            : {},
        thumbnail: ((_q = data.thumbnailRenderer.playlistVideoThumbnailRenderer) === null || _q === void 0 ? void 0 : _q.thumbnail.thumbnails.length) ? data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails[data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails.length - 1].url : null
    });
    return res;
}
exports.playlist_info = playlist_info;
function getPlaylistVideos(data, limit = Infinity) {
    var _a, _b, _c, _d;
    const videos = [];
    for (let i = 0; i < data.length; i++) {
        if (limit === videos.length)
            break;
        const info = data[i].playlistVideoRenderer;
        if (!info || !info.shortBylineText)
            continue;
        videos.push(new Video_1.Video({
            id: info.videoId,
            index: parseInt((_a = info.index) === null || _a === void 0 ? void 0 : _a.simpleText) || 0,
            duration: parseDuration((_b = info.lengthText) === null || _b === void 0 ? void 0 : _b.simpleText) || 0,
            duration_raw: (_d = (_c = info.lengthText) === null || _c === void 0 ? void 0 : _c.simpleText) !== null && _d !== void 0 ? _d : "0:00",
            thumbnail: {
                id: info.videoId,
                url: info.thumbnail.thumbnails[info.thumbnail.thumbnails.length - 1].url,
                height: info.thumbnail.thumbnails[info.thumbnail.thumbnails.length - 1].height,
                width: info.thumbnail.thumbnails[info.thumbnail.thumbnails.length - 1].width
            },
            title: info.title.runs[0].text,
            channel: {
                id: info.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId || undefined,
                name: info.shortBylineText.runs[0].text || undefined,
                url: `https://www.youtube.com${info.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl || info.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
                icon: undefined
            }
        }));
    }
    return videos;
}
exports.getPlaylistVideos = getPlaylistVideos;
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
function getContinuationToken(data) {
    var _a, _b, _c;
    const continuationToken = (_c = (_b = (_a = data.find((x) => Object.keys(x)[0] === "continuationItemRenderer")) === null || _a === void 0 ? void 0 : _a.continuationItemRenderer.continuationEndpoint) === null || _b === void 0 ? void 0 : _b.continuationCommand) === null || _c === void 0 ? void 0 : _c.token;
    return continuationToken;
}
exports.getContinuationToken = getContinuationToken;
//# sourceMappingURL=extractor.js.map