interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>{description}</p>
      {action}
    </div>
  )
}
