import { Video } from "../classes/Video";
import { PlayList } from "../classes/Playlist";
import { Channel } from "../classes/Channel";
export interface ParseSearchInterface {
    type?: "video" | "playlist" | "channel";
    limit?: number;
}
export interface thumbnail {
    width: string;
    height: string;
    url: string;
}
export declare function ParseSearchResult(html: string, options?: ParseSearchInterface): (Video | PlayList | Channel)[];
export declare function parseChannel(data?: any): Channel | void;
export declare function parseVideo(data?: any): Video | void;
export declare function parsePlaylist(data?: any): PlayList | void;
//# sourceMappingURL=parser.d.ts.map