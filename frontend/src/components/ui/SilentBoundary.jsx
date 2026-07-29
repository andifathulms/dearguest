import { Component } from 'react'

/**
 * Renders nothing when its subtree throws, and reports it once.
 *
 * `Suspense` only handles the *pending* state of a lazy import — if the chunk
 * fails to fetch (flaky network, stale hash after a deploy) the promise rejects
 * and the error propagates past Suspense, unmounting everything above it. For
 * an enhancement layer like the motion backdrop that must never be able to take
 * the invitation down with it.
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
    return this.state.failed ? null : this.props.children
  }
}
