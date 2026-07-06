export default function FetchError({ message = 'فشل تحميل البيانات', onRetry }) {
  return (
    <div className="empty-state" style={{ padding: '40px 20px' }}>
      <div className="empty-icon">🔌</div>
      <h3>خطأ في الاتصال</h3>
      <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--muted)' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}
