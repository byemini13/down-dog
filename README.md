# Down Dog

Eighteen-minute hip and back holds. Open it on your iPhone, put the phone on the mat, and follow the voice.

**Use it here:** [https://byemini13.github.io/down-dog/](https://byemini13.github.io/down-dog/)

## Add it to your iPhone

1. Open the link in **Safari** (not Chrome).
2. Tap **Share**, then **Add to Home Screen**.
3. Open Down Dog from the home screen icon.

## Before you start

- Leave the phone on the mat with the **screen on**. Locking the phone or switching apps pauses the timer.
- Turn the **media volume up** and check your selected speaker or headphones.
- You will hear a chime, then a description, each time the stretch changes or it is time to switch sides.
- Use **Replay instructions** whenever you need to hear the current position again. If playback is blocked or interrupted, the app shows a message beside this control.

## How a session works

There are four routines, each exactly 18 minutes (five two-sided holds plus a two-minute closing meditation):

1. Hip Opener
2. Lower Back Release
3. Glutes and Hamstrings
4. Deep Release

The home screen shows the upcoming routine. Tapping **Begin** starts that one and rotates to the next for the following session.

During a hold you get a full-body studio-style position guide, the side (left or right), a countdown, and any easier-option or caution notes. The image demonstrates the position; follow the side named in the written and spoken instructions. You can **Pause**, **Replay instructions**, **Skip this hold**, or **End practice**.

Switching apps or locking the screen pauses the timer and sound. Tap **Resume practice** when you return; the current instructions repeat. Skipping while paused changes the hold without starting sound.

Voice cues are bundled recordings, with the chime and speech in the same file. The app caches all images and recordings for offline use after its initial download. Safari audio byte-range requests are supported by the offline cache.

## Edit the routines

Stretches, cues, and timings live in [`routines.json`](routines.json). Keep each routine at 1080 seconds if you want the 18:00 clock to stay honest. `{side}` and `{otherSide}` in cues resolve to the current side before display or speech.

The 19 position guides are 1536 × 1024 WebP files in [`poses/`](poses/). They were generated with the built-in imagegen tool; prompts and provenance are in [`poses/PROMPTS.md`](poses/PROMPTS.md).

After editing cues, regenerate the voice recordings and offline asset list on macOS with the Samantha voice and `ffmpeg` installed:

```bash
npm run build:audio
node scripts/build_offline.mjs
npm test
```

Commit the resulting `audio/`, `js/cues.js`, and `js/offline-assets.js` files along with your changes. Bump the cache version in `sw.js` when shipping updated assets. No build tools are needed to serve the app.

To try changes on a computer:

```bash
python3 -m http.server 8765
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).
