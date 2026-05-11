interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <span className="text-red-500 mt-0.5 text-sm">✕</span>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-sm shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
