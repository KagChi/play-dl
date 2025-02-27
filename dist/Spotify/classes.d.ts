import { SpotifyDataOptions } from ".";
interface SpotifyTrackAlbum {
    name: string;
    url: string;
    id: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
}
interface SpotifyArtists {
    name: string;
    url: string;
    id: string;
}
interface SpotifyThumbnail {
    height: number;
    width: number;
    url: string;
}
interface SpotifyCopyright {
    text: string;
    type: string;
}
export declare class SpotifyVideo {
    name: string;
    type: "track" | "playlist" | "album";
    id: string;
    url: string;
    explicit: boolean;
    durationInSec: number;
    durationInMs: number;
    artists: SpotifyArtists[];
    album: SpotifyTrackAlbum;
    thumbnail: SpotifyThumbnail;
    constructor(data: any);
    toJSON(): {
        name: string;
        id: string;
        type: "track" | "playlist" | "album";
        url: string;
        explicit: boolean;
        durationInMs: number;
        durationInSec: number;
        artists: SpotifyArtists[];
        album: SpotifyTrackAlbum;
        thumbnail: SpotifyThumbnail;
    };
}
export declare class SpotifyPlaylist {
    name: string;
    type: "track" | "playlist" | "album";
    collaborative: boolean;
    description: string;
    url: string;
    id: string;
    thumbnail: SpotifyThumbnail;
    owner: SpotifyArtists;
    tracksCount: number;
    private spotifyData;
    private fetched_tracks;
    constructor(data: any, spotifyData: SpotifyDataOptions);
    fetch(): Promise<this | undefined>;
    page(num: number): SpotifyVideo[] | undefined;
    get total_pages(): number;
    get total_tracks(): number;
    toJSON(): {
        name: string;
        type: "track" | "playlist" | "album";
        collaborative: boolean;
        description: string;
        url: string;
        id: string;
        thumbnail: SpotifyThumbnail;
        owner: SpotifyArtists;
    };
}
export declare class SpotifyAlbum {
    name: string;
    type: "track" | "playlist" | "album";
    url: string;
    id: string;
    thumbnail: SpotifyThumbnail;
    artists: SpotifyArtists[];
    copyrights: SpotifyCopyright[];
    release_date: string;
    release_date_precision: string;
    trackCount: number;
    private spotifyData;
    private fetched_tracks;
    constructor(data: any, spotifyData: SpotifyDataOptions);
    fetch(): Promise<this | undefined>;
    page(num: number): SpotifyTracks[] | undefined;
    get total_pages(): number;
    get total_tracks(): number;
    toJSON(): {
        name: string;
        type: "track" | "playlist" | "album";
        url: string;
        thumbnail: SpotifyThumbnail;
        artists: SpotifyArtists[];
        copyrights: SpotifyCopyright[];
        release_date: string;
        release_date_precision: string;
        total_tracks: number;
    };
}
declare class SpotifyTracks {
    name: string;
    type: "track" | "playlist" | "album";
    id: string;
    url: string;
    explicit: boolean;
    durationInSec: number;
    durationInMs: number;
    artists: SpotifyArtists[];
    constructor(data: any);
    toJSON(): {
        name: string;
        id: string;
        type: "track" | "playlist" | "album";
        url: string;
        explicit: boolean;
        durationInMs: number;
        durationInSec: number;
        artists: SpotifyArtists[];
    };
}
export {};
//# sourceMappingURL=classes.d.ts.map