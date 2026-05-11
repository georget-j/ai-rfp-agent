interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Working…' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center text-gray-500">
      <span className="animate-spin text-lg">⟳</span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
    </span>
  )
}
