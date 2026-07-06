import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon">⚠️</div>
          <h3>حدث خطأ غير متوقع</h3>
          <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--muted)' }}>
            {this.state.error?.message || 'حدث خطأ أثناء تحميل هذه الصفحة'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
