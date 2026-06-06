import { Component } from 'react'
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null, copied: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[HabitForge] Uncaught error:', error, info)
  }

  onCopy = async () => {
    try {
      const text = `${this.state.error?.message || ''}\n\n${this.state.error?.stack || ''}`
      await navigator.clipboard.writeText(text)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 1800)
    } catch {}
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Something broke</h1>
          <p className="text-sm text-slate-500 mt-1">
            The app hit a runtime error. Most often this is caused by a missing dependency or an icon name that
            doesn't exist in the installed version of <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">lucide-react</code>.
          </p>
          <pre className="mt-4 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-auto max-h-48 font-mono leading-relaxed whitespace-pre-wrap break-words">
{String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={this.onCopy} className="flex-1 btn-secondary justify-center text-xs">
              {this.state.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {this.state.copied ? 'Copied' : 'Copy error'}
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 btn-primary justify-center text-xs">
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
