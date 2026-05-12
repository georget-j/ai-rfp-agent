interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div style={{ borderRadius: 'var(--r-sm)', border: '1px solid color-mix(in oklch, var(--danger) 30%, transparent)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface-2))', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: 'var(--danger)', fontSize: 13, marginTop: 1 }}>✕</span>
        <p style={{ fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ color: 'var(--danger)', opacity: 0.7, fontSize: 12, flexShrink: 0, cursor: 'pointer', background: 'none', border: 'none' }}
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
