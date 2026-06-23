-- 0003_group_name_proposals.sql
-- Migration to support group name rename proposals requiring 2-key approval

create table public.group_name_proposals (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    proposed_name text not null,
    proposed_by_member_id uuid references public.members(id) on delete cascade not null,
    approved_by_member_id uuid references public.members(id) on delete cascade,
    status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    approved_at timestamp with time zone
);

create index idx_group_name_proposals_group_id on public.group_name_proposals(group_id);
create index idx_group_name_proposals_status on public.group_name_proposals(status);

alter table public.group_name_proposals enable row level security;

create policy "Members can view name proposals for their groups"
    on public.group_name_proposals
    for select
    to authenticated
    using (public.is_member_of_group(group_id));

create policy "Treasurers can create name proposals for their groups"
    on public.group_name_proposals
    for insert
    to authenticated
    with check (public.is_treasurer_of_group(group_id));

create policy "Members can update name proposals for their groups"
    on public.group_name_proposals
    for update
    to authenticated
    using (public.is_member_of_group(group_id))
    with check (public.is_member_of_group(group_id));
