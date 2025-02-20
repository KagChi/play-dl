import { Video } from '../classes/Video';
import { PlayList } from '../classes/Playlist';
export declare function yt_validate(url: string): "playlist" | "video" | boolean;
export declare function extractID(url: string): string;
export declare function video_basic_info(url: string, cookie?: string): Promise<{
    LiveStreamData: {
        isLive: any;
        dashManifestUrl: any;
        hlsManifestUrl: any;
    };
    format: any[];
    video_details: {
        id: any;
        url: string;
        title: any;
        description: any;
        durationInSec: any;
        durationRaw: string;
        uploadedDate: any;
        thumbnail: any;
        channel: {
            name: any;
            id: any;
            url: string;
            verified: null;
        };
        views: any;
        tags: any;
        averageRating: any;
        live: any;
        private: any;
    };
}>;
export declare function video_info(url: string, cookie?: string): Promise<{
    LiveStreamData: {
        isLive: any;
        dashManifestUrl: any;
        hlsManifestUrl: any;
    };
    format: any[];
    video_details: {
        id: any;
        url: string;
        title: any;
        description: any;
        durationInSec: any;
        durationRaw: string;
        uploadedDate: any;
        thumbnail: any;
        channel: {
            name: any;
            id: any;
            url: string;
            verified: null;
        };
        views: any;
        tags: any;
        averageRating: any;
        live: any;
        private: any;
    };
}>;
export declare function playlist_info(url: string, parseIncomplete?: boolean): Promise<PlayList | undefined>;
export declare function getPlaylistVideos(data: any, limit?: number): Video[];
export declare function getContinuationToken(data: any): string;
//# sourceMappingURL=extractor.d.ts.map