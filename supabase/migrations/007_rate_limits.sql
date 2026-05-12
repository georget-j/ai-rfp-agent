create table if not exists rate_limits (
  ip        text        not null,
  endpoint  text        not null,
  window_start  timestamptz not null default now(),
  request_count integer     not null default 0,
  primary key (ip, endpoint)
);

create or replace function check_rate_limit(
  p_ip             text,
  p_endpoint       text,
  p_window_seconds integer,
  p_max_requests   integer
) returns boolean
language plpgsql
as $$
declare
  v_window_start timestamptz;
  v_count        integer;
begin
  select window_start, request_count
    into v_window_start, v_count
    from rate_limits
   where ip = p_ip and endpoint = p_endpoint
     for update;

  if not found then
    insert into rate_limits (ip, endpoint, window_start, request_count)
    values (p_ip, p_endpoint, now(), 1);
    return true;
  end if;

  if now() > v_window_start + (p_window_seconds || ' seconds')::interval then
    update rate_limits
       set window_start = now(), request_count = 1
     where ip = p_ip and endpoint = p_endpoint;
    return true;
  end if;

  if v_count >= p_max_requests then
    return false;
  end if;

  update rate_limits
     set request_count = request_count + 1
   where ip = p_ip and endpoint = p_endpoint;

  return true;
end;
$$;
