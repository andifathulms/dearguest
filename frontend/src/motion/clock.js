/**
 * A seekable frame clock.
 *
 * This is what Remotion's <Player> was actually providing: a monotonic frame
 * counter you can pause and seek. Everything else it brought — a composition
 * renderer, silent <audio> elements for A/V sync, a video encoder — went
 * unused, and the audio elements were an active nuisance (browsers treat them
 * as blocked media, which is why playback needed an explicit play() call and a
 * first-gesture retry).
 *
 * The frame is computed from elapsed time on demand rather than accumulated in
 * a loop, so there is no rAF of its own to run and — more importantly — the
 * frame never depends on how many times it has been read.
 */
export function createFrameClock({ fps = 30, durationInFrames = 600, loop = true } = {}) {
  let paused = true
  let pausedFrame = 0
  // Frame the current play run started from, and when it started.
  let originFrame = 0
  let originTime = 0

  function wrap(frame) {
    if (!loop) return Math.min(Math.max(0, frame), durationInFrames)
    return ((frame % durationInFrames) + durationInFrames) % durationInFrames
  }

  return {
    fps,
    durationInFrames,

    getCurrentFrame() {
      if (paused) return wrap(pausedFrame)
      const elapsed = ((performance.now() - originTime) / 1000) * fps
      return wrap(Math.floor(originFrame + elapsed))
    },

    isPlaying() {
      return !paused
    },

    play() {
      if (!paused) return
      originFrame = pausedFrame
      originTime = performance.now()
      paused = false
    },

    pause() {
      if (paused) return
      pausedFrame = this.getCurrentFrame()
      paused = true
    },

    seekTo(frame) {
      const target = wrap(Math.floor(frame))
      if (paused) {
        pausedFrame = target
      } else {
        originFrame = target
        originTime = performance.now()
      }
    },
  }
}
