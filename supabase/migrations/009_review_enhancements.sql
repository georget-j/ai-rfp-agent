-- Seed demo reviewer emails into routing_config
update routing_config set
  owner_email      = 'alice.chen@acme.com',
  backup_email     = 'david.park@acme.com',
  escalation_hours = 24
where topic = 'security_compliance';

update routing_config set
  owner_email      = 'james.wright@acme.com',
  backup_email     = 'sarah.moss@acme.com',
  escalation_hours = 24
where topic = 'legal';

update routing_config set
  owner_email      = 'nina.torres@acme.com',
  backup_email     = 'chris.hall@acme.com',
  escalation_hours = 24
where topic = 'pricing';

update routing_config set
  owner_email      = 'raj.patel@acme.com',
  backup_email     = 'emma.liu@acme.com',
  escalation_hours = 24
where topic = 'technical';

update routing_config set
  owner_email      = 'tom.baker@acme.com',
  backup_email     = 'lisa.nguyen@acme.com',
  escalation_hours = 24
where topic = 'commercial';

update routing_config set
  owner_email      = 'ben.foster@acme.com',
  backup_email     = 'kate.riley@acme.com',
  escalation_hours = 24
where topic = 'implementation';

update routing_config set
  owner_email      = 'maria.santos@acme.com',
  backup_email     = 'oliver.wood@acme.com',
  escalation_hours = 24
where topic = 'support';

update routing_config set
  owner_email      = 'anna.kim@acme.com',
  backup_email     = 'mark.chen@acme.com',
  escalation_hours = 24
where topic = 'general';

-- Add backup_notified_at to review_requests for escalation tracking
alter table review_requests
  add column if not exists backup_notified_at timestamptz;

-- Discussion thread on review requests
create table if not exists review_comments (
  id                uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references review_requests(id) on delete cascade,
  author_email      text not null,
  body              text not null,
  created_at        timestamptz not null default now()
);

create index if not exists review_comments_request_idx on review_comments(review_request_id);

-- Audit trail for all review actions
create table if not exists review_audit_log (
  id                uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references review_requests(id) on delete cascade,
  actor_email       text not null,
  action            text not null,
  details           jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists review_audit_log_request_idx on review_audit_log(review_request_id);
