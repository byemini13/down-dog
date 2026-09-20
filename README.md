# Down Dog

Eighteen-minute hip and back holds. Open it on your iPhone, put the phone on the mat, and follow the voice.

**Use it here:** [https://byemini13.github.io/down-dog/](https://byemini13.github.io/down-dog/)

## Add it to your iPhone

1. Open the link in **Safari** (not Chrome).
2. Tap **Share**, then **Add to Home Screen**.
3. Open Down Dog from the home screen icon.

## Before you start

- Leave the phone on the mat with the **screen on**. Locking the phone or switching apps pauses the timer.
- Turn the **ringer on**. The silent switch mutes the chime and often the spoken cues. There is no web workaround for that.
- You will hear a chime, then a description, each time the stretch changes or it is time to switch sides.

## How a session works

There are four routines, each exactly 18 minutes (five two-sided holds plus a two-minute closing meditation):

1. Hip Opener
2. Lower Back Release
3. Glutes and Hamstrings
4. Deep Release

The home screen shows the upcoming routine. Tapping **Begin** starts that one and rotates to the next for the following session.

During a hold you get a pose drawing, the side (left or right), a countdown, and any easier-option or caution notes. You can **Pause**, **Skip this hold**, or **End practice**.

## Edit the routines

Stretches, cues, and timings live in [`routines.json`](routines.json). Keep each routine at 1080 seconds if you want the 18:00 clock to stay honest. Pose drawings are the SVG files in [`poses/`](poses/), one per stretch id.

To try changes on a computer:

```bash
python3 -m http.server 8765
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).
