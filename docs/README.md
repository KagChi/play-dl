# Play-dl commands

For source specific commands :-
- [YouTube](https://github.com/play-dl/play-dl/tree/main/docs/YouTube#youtube)
- [Spotify](https://github.com/play-dl/play-dl/tree/main/docs/Spotify#spotify)

### Validate

#### validate(url : `string`)
*This checks all type of urls that are supported by play-dl.*

**Returns :** `sp_track` | `sp_album` | `sp_playlist` | `yt_video` | `yt_playlist` | `false`

sp = Spotify

yt = YouTube
```js
let check = validate(url)

if(!check) // Invalid URL

if(check === 'yt_video') // YouTube Video

if(check === 'sp_track') // Spotify Track
```
