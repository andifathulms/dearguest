import { Component } from 'react'

/**
 * Renders `fallback` (nothing by default) when its subtree throws.
 *
 * `Suspense` only handles the *pending* state of a lazy import — if the chunk
 * fails to fetch (flaky network, stale hash after a deploy) the promise rejects
 * and the error propagates past Suspense, unmounting everything above it.
 *
 * Rendering nothing is right for a decorative layer like the motion backdrop,
 * which must never be able to take the invitation down with it. Anything the
 * guest actually came to see should pass a real fallback instead.
 */
export default class SilentBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    this.props.onError?.(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return this.props.fallback ?? null
  }
}
