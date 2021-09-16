import { request } from './request';
import axios from 'axios';
import { Video } from '../classes/Video'
import { PlayList } from '../classes/Playlist'

const DEFAULT_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const video_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
const playlist_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m)\.)?(youtube\.com)\/(?:(playlist|watch))(.*)?((\?|\&)list=)/

export function yt_validate(url : string): "playlist" | "video" | boolean {
    if(url.indexOf('list=') === -1){
        if(!url.match(video_pattern)) return false
        else return "video"
    }
    else {
        if(!url.match(playlist_pattern)) return false
        let Playlist_id = url.split('list=')[1].split('&')[0]
        if(Playlist_id.length !== 34 || !Playlist_id.startsWith('PL')){
            return false
        }
        return "playlist"
    }
}

export function extractID(url : string): string{
    if(url.startsWith('https')){
        if(url.indexOf('list=') === -1){
            let video_id : string;
            if(url.includes('youtu.be/')) video_id = url.split('youtu.be/')[1].split('/')[0]
            else if(url.includes('youtube.com/embed/')) video_id = url.split('youtube.com/embed/')[1].split('/')[0]
            else video_id = url.split('watch?v=')[1].split('&')[0];
            return video_id
        }
        else{
            return url.split('list=')[1].split('&')[0]
        }
    }
    else return url
}

export async function video_basic_info(url : string, cookie? : string){
        let video_id : string;
        if(url.startsWith('https')) {
            if(yt_validate(url) !== 'video') throw new Error('This is not a YouTube Watch URL')
            video_id = extractID(url)
        }
        else video_id = url
        let { data: dataJson } = await axios.post('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
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
        if(dataJson.playabilityStatus.status !== 'OK') throw new Error(`While getting info from url\n${dataJson.playabilityStatus.errorScreen.playerErrorMessageRenderer?.reason.simpleText ?? dataJson.playabilityStatus.errorScreen.playerKavRenderer?.reason.simpleText}`)
        let format = []
        let vid = dataJson.videoDetails
        let microformat = dataJson.microformat?.playerMicroformatRenderer
        let video_details = {
            id : vid.videoId,
            url : `https://www.youtube.com/watch?v=${vid.videoId}`,
            title : vid.title,
            description : vid.shortDescription,
            durationInSec : vid.lengthSeconds,
            durationRaw : parseSeconds(vid.lengthSeconds),
            uploadedDate : microformat?.publishDate,
            thumbnail : vid.thumbnail.thumbnails[vid.thumbnail.thumbnails.length - 1],
            channel : {
                name : vid.author,
                id : vid.channelId,
                url : `https://www.youtube.com/channel/${vid.channelId}`,
                verified: null
            },
            views : vid.viewCount,
            tags : vid.keywords,
            averageRating : vid.averageRating,
            live : vid.isLiveContent,
            private : vid.isPrivate
        }
        if(!video_details.live) format.push(dataJson.streamingData.formats[0])
        format.push(...dataJson.streamingData.adaptiveFormats)
        let LiveStreamData = {
            isLive : video_details.live,
            dashManifestUrl: dataJson.streamingData?.dashManifestUrl ?? null,
            hlsManifestUrl: dataJson.streamingData?.hlsManifestUrl ?? null
        }
        return {
            LiveStreamData,
            format,
            video_details
        }
}

function parseSeconds(seconds : number): string {
    let d = Number(seconds);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? (h < 10 ? `0${h}` : h) + ':' : "";
    var mDisplay = m > 0 ? (m < 10 ? `0${m}` : m) + ':' : "00:";
    var sDisplay = s > 0 ? (s < 10 ? `0${s}` : s)  : "00";
    return hDisplay + mDisplay + sDisplay; 
}

export async function video_info(url : string, cookie? : string) {
    let data = await video_basic_info(url, cookie)
    if(data.LiveStreamData.isLive === true && data.LiveStreamData.hlsManifestUrl !== null){
        return data
    }
    else {
        return data
    }
}

export async function playlist_info(url : string, parseIncomplete : boolean = false) {
    if (!url || typeof url !== "string") throw new Error(`Expected playlist url, received ${typeof url}!`);
    let Playlist_id : string
    if(url.startsWith('https')){
        if(yt_validate(url) !== 'playlist') throw new Error('This is not a Playlist URL')
        Playlist_id = extractID(url)
    }
    else Playlist_id = url
    let new_url = `https://www.youtube.com/playlist?list=${Playlist_id}`
    
    let body = await request(new_url, {
        headers : {'accept-language' : 'en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7'}
    })
    let response = JSON.parse(body.split("var ytInitialData = ")[1].split(";</script>")[0])
    if(response.alerts){ 
        if(response.alerts[0].alertWithButtonRenderer?.type === 'INFO') {
            if(!parseIncomplete) throw new Error(`While parsing playlist url\n${response.alerts[0].alertWithButtonRenderer.text.simpleText}`)
        }
        else if(response.alerts[0].alertRenderer?.type === 'ERROR') throw new Error(`While parsing playlist url\n${response.alerts[0].alertRenderer.text.runs[0].text}`)
        else throw new Error('While parsing playlist url\nUnknown Playlist Error')
    }

    let rawJSON = `${body.split('{"playlistVideoListRenderer":{"contents":')[1].split('}],"playlistId"')[0]}}]`;
    let parsed = JSON.parse(rawJSON);
    let playlistDetails = JSON.parse(body.split('{"playlistSidebarRenderer":')[1].split("}};</script>")[0]).items;

    let API_KEY = body.split('INNERTUBE_API_KEY":"')[1]?.split('"')[0] ?? body.split('innertubeApiKey":"')[1]?.split('"')[0] ?? DEFAULT_API_KEY;
    let videos = getPlaylistVideos(parsed, 100);

    let data = playlistDetails[0].playlistSidebarPrimaryInfoRenderer;
    if (!data.title.runs || !data.title.runs.length) return undefined;

    let author = playlistDetails[1]?.playlistSidebarSecondaryInfoRenderer.videoOwner;
    let views = data.stats.length === 3 ? data.stats[1].simpleText.replace(/[^0-9]/g, "") : 0;
    let lastUpdate = data.stats.find((x: any) => "runs" in x && x["runs"].find((y: any) => y.text.toLowerCase().includes("last update")))?.runs.pop()?.text ?? null;
    let videosCount = data.stats[0].runs[0].text.replace(/[^0-9]/g, "") || 0;

    let res = new PlayList({
        continuation: {
            api: API_KEY,
            token: getContinuationToken(parsed),
            clientVersion: body.split('"INNERTUBE_CONTEXT_CLIENT_VERSION":"')[1]?.split('"')[0] ?? body.split('"innertube_context_client_version":"')[1]?.split('"')[0] ?? "<some version>"
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
        thumbnail: data.thumbnailRenderer.playlistVideoThumbnailRenderer?.thumbnail.thumbnails.length ? data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails[data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails.length - 1].url : null
    });
    return res;
}

export function getPlaylistVideos(data:any, limit : number = Infinity) : Video[] {
    const videos = [];

    for (let i = 0; i < data.length; i++) {
        if (limit === videos.length) break;
        const info = data[i].playlistVideoRenderer;
        if (!info || !info.shortBylineText) continue;

        videos.push(
            new Video({
                id: info.videoId,
                index: parseInt(info.index?.simpleText) || 0,
                duration: parseDuration(info.lengthText?.simpleText) || 0,
                duration_raw: info.lengthText?.simpleText ?? "0:00",
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
            })
        );
    }
    return videos   
}

function parseDuration(duration: string): number {
    duration ??= "0:00";
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


export function getContinuationToken(data:any): string {
    const continuationToken = data.find((x: any) => Object.keys(x)[0] === "continuationItemRenderer")?.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token;
    return continuationToken;
}
