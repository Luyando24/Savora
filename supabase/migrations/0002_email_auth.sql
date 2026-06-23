-- 0002_email_auth.sql
-- Migration to support email-based registration and login

-- 1. Alter Members Table to support email
alter table public.members add column email text;

-- Make phone_number optional
alter table public.members alter column phone_number drop not null;

-- Remove old phone number uniqueness constraint per group, add email uniqueness constraint
alter table public.members drop constraint if exists unique_member_phone_per_group;
alter table public.members add constraint unique_member_email_per_group unique (group_id, email);

-- Create index on email for login lookup
create index if not exists idx_members_email on public.members(email);


-- 2. Update Helper Functions to use email and auth.jwt() ->> 'email'
drop function if exists public.current_member();

create or replace function public.is_member_of_group(target_group_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 
        from public.members 
        where email = auth.jwt() ->> 'email' 
          and group_id = target_group_id
    );
end;
$$ language plpgsql security definer;

create or replace function public.is_treasurer_of_group(target_group_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 
        from public.members 
        where email = auth.jwt() ->> 'email' 
          and role = 'treasurer' 
          and group_id = target_group_id
    );
end;
$$ language plpgsql security definer;

create or replace function public.current_member()
returns table (
    id uuid,
    group_id uuid,
    role text,
    email text
) as $$
begin
    return query
    select m.id, m.group_id, m.role, m.email 
    from public.members m
    where m.email = auth.jwt() ->> 'email';
end;
$$ language plpgsql security definer;


-- 3. Update RLS Policies referencing auth.jwt() ->> 'phone'

-- Drop affected Policies
drop policy if exists "Treasurers can insert members into their group, or users can insert themselves" on public.members;
drop policy if exists "Members can view transactions in their groups" on public.transactions;
drop policy if exists "Treasurers can insert transactions, or members can insert their own pending contribution" on public.transactions;

-- Recreate Policies with email mapping
create policy "Treasurers can insert members into their group, or users can insert themselves"
    on public.members
    for insert
    to authenticated
    with check (
        public.is_treasurer_of_group(group_id) 
        or email = auth.jwt() ->> 'email'
    );

create policy "Members can view transactions in their groups"
    on public.transactions
    for select
    to authenticated
    using (
        public.is_treasurer_of_group(group_id) 
        or member_id in (
            select id from public.members 
            where email = auth.jwt() ->> 'email' 
              and group_id = transactions.group_id
        )
    );

create policy "Treasurers can insert transactions, or members can insert their own pending contribution"
    on public.transactions
    for insert
    to authenticated
    with check (
        public.is_treasurer_of_group(group_id)
        or (
            member_id in (
                select id from public.members 
                where email = auth.jwt() ->> 'email' 
                  and group_id = transactions.group_id
            )
            and status = 'pending'
            and type = 'contribution'
        )
    );
