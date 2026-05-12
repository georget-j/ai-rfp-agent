import { RoutingConfigTable } from '@/components/RoutingConfigTable'
import { IntegrationPanel } from '@/components/IntegrationPanel'

export default function AdminPage() {
  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin</h1>
        <p className="text-sm text-gray-500">Configure routing rules and integrations for the human review workflow.</p>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Routing Rules</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign an owner email to each topic. Low-confidence or high-risk answers are routed to the topic owner for review.
          </p>
        </div>
        <RoutingConfigTable />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure email and Slack channels for review notifications.
          </p>
        </div>
        <IntegrationPanel />
      </section>
    </div>
  )
}
