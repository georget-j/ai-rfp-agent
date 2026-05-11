interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )
}
