# Music

The music toggle in the header looks for **`judas.mp3`** in this folder and loops
it. Drop your own copy of Lady Gaga's "Judas" here:

```
public/audio/judas.mp3
```

The recording is not in this repository — it's copyrighted, and `.gitignore`
keeps audio files in this folder out of commits, so pushing the repo never
publishes it. Supply it locally, or point `src/audio/music.js` at a file you have
the rights to.

If `judas.mp3` isn't here, the toggle plays the built-in 8-bit chiptune loop
instead (synthesized in `src/audio/music.js`), so the button always does
something. That loop is an original dance-pop composition written for this app,
not a transcription of any existing song.
