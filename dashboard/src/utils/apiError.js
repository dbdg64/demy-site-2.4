/**
 * Extract a user-friendly error message from a fetch/API error.
 * Use in .catch() handlers: `.catch(err => showToast(apiErrorMessage(err), 'error'))`
 */
export function apiErrorMessage(err, fallback = 'حدث خطأ في الاتصال') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  return err.message || fallback
}
