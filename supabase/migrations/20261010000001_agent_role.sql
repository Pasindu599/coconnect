-- ADR-015: the coconut bidder role `broker` is renamed `agent`, and the
-- construction role `subcontractor` is removed (folded into `contractor`).
--
-- Mirrors src/config/categories.ts (CONTRACTS C1); `upgradeMemberships` there
-- does the same rewrite for state the demo saved in the browser.

-- Rewrite existing memberships: broker -> agent, subcontractor -> contractor,
-- keeping the original order and dropping the duplicates that leaves (a user
-- who held both contractor and subcontractor ends up with one contractor).
update public.users u
   set memberships = (
         select coalesce(jsonb_agg(m.membership order by m.first_pos), '[]'::jsonb)
           from (
             select membership, min(pos) as first_pos
               from (
                 select jsonb_build_object(
                          'category', e.value ->> 'category',
                          'role', case e.value ->> 'role'
                                    when 'broker' then 'agent'
                                    when 'subcontractor' then 'contractor'
                                    else e.value ->> 'role'
                                  end
                        ) as membership,
                        e.ordinality as pos
                   from jsonb_array_elements(u.memberships) with ordinality as e(value, ordinality)
               ) renamed
              group by membership
           ) m
       )
 where u.memberships @> '[{"role": "broker"}]'::jsonb
    or u.memberships @> '[{"role": "subcontractor"}]'::jsonb;

create or replace function private.is_valid_category_role(p_category text, p_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_category
    when 'coconut' then p_role in ('owner', 'agent', 'worker')
    when 'construction' then p_role in ('client', 'contractor', 'worker')
    else false
  end;
$$;

create or replace function private.is_bidder(p_category text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.has_membership(p_category, 'agent')
      or private.has_membership(p_category, 'contractor');
$$;
