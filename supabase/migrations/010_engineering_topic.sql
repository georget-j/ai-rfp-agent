-- Add engineering as a first-class routing topic
insert into routing_config (topic, owner_email, backup_email, preferred_channel, escalation_hours)
values ('engineering', 'alex.turner@acme.com', 'sam.lee@acme.com', 'email', 24)
on conflict (topic) do update set
  owner_email      = excluded.owner_email,
  backup_email     = excluded.backup_email,
  escalation_hours = excluded.escalation_hours;
