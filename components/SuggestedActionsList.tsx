interface SuggestedActionsListProps {
  actions: string[]
}

export function SuggestedActionsList({ actions }: SuggestedActionsListProps) {
  if (actions.length === 0) return null

  return (
    <ol className="space-y-1.5">
      {actions.map((action, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-gray-700">{action}</span>
        </li>
      ))}
    </ol>
  )
}
