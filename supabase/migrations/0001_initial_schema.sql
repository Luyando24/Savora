-- 0001_initial_schema.sql
-- Database schema migration for Chilimba platform

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Groups Table
create table public.groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    type text not null check (type in ('savings', 'co-op', 'sacco')),
    location text,
    cycle_settings jsonb default '{}'::jsonb not null,
    registration_status text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Members Table
create table public.members (
    id uuid primary key default gen_random_uuid(),
    phone_number text not null,
    name text not null,
    group_id uuid references public.groups(id) on delete cascade not null,
    role text not null check (role in ('member', 'treasurer')),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_member_phone_per_group unique (group_id, phone_number)
);

-- Index on phone_number for auth queries
create index idx_members_phone_number on public.members(phone_number);

-- 4. Create Transactions Table
create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    member_id uuid references public.members(id) on delete cascade not null,
    type text not null check (type in ('contribution', 'loan_disbursement', 'repayment', 'payout')),
    amount numeric(12,2) not null check (amount > 0),
    provider text not null check (provider in ('mtn', 'airtel', 'manual')),
    provider_reference_id text,
    status text not null check (status in ('pending', 'completed', 'failed')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_transactions_group_id on public.transactions(group_id);
create index idx_transactions_member_id on public.transactions(member_id);
create index idx_transactions_status on public.transactions(status);

-- 5. Create Cycles Table
create table public.cycles (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    payout_rules jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_cycles_group_id on public.cycles(group_id);

-- 6. Helper Functions for RLS
-- Checks if a phone number belongs to a member of a group
create or replace function public.is_member_of_group(target_group_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 
        from public.members 
        where phone_number = auth.jwt() ->> 'phone' 
          and group_id = target_group_id
    );
end;
$$ language plpgsql security definer;

-- Checks if a phone number belongs to a treasurer of a group
create or replace function public.is_treasurer_of_group(target_group_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 
        from public.members 
        where phone_number = auth.jwt() ->> 'phone' 
          and role = 'treasurer' 
          and group_id = target_group_id
    );
end;
$$ language plpgsql security definer;

-- Helper to retrieve current member info
create or replace function public.current_member()
returns table (
    id uuid,
    group_id uuid,
    role text,
    phone_number text
) as $$
begin
    return query
    select m.id, m.group_id, m.role, m.phone_number 
    from public.members m
    where m.phone_number = auth.jwt() ->> 'phone';
end;
$$ language plpgsql security definer;

-- 7. Create Ledger Summary View (Security Invoker)
create view public.ledger_summary with (security_invoker = true) as
select
    m.id as member_id,
    m.group_id,
    m.name as member_name,
    m.phone_number,
    m.role,
    coalesce(sum(case when t.type = 'contribution' and t.status = 'completed' then t.amount else 0 end), 0) as total_contributions,
    coalesce(sum(case when t.type = 'repayment' and t.status = 'completed' then t.amount else 0 end), 0) as total_repayments,
    coalesce(sum(case when t.type = 'loan_disbursement' and t.status = 'completed' then t.amount else 0 end), 0) as total_loans,
    coalesce(sum(case when t.type = 'payout' and t.status = 'completed' then t.amount else 0 end), 0) as total_payouts,
    coalesce(sum(case when t.type = 'loan_disbursement' and t.status = 'completed' then t.amount else 0 end), 0) -
      coalesce(sum(case when t.type = 'repayment' and t.status = 'completed' then t.amount else 0 end), 0) as outstanding_loans,
    coalesce(sum(case when t.type = 'contribution' and t.status = 'completed' then t.amount else 0 end), 0) -
      coalesce(sum(case when t.type = 'payout' and t.status = 'completed' then t.amount else 0 end), 0) as active_balance
from public.members m
left join public.transactions t on m.id = t.member_id
group by m.id, m.group_id, m.name, m.phone_number, m.role;

-- 8. Enable Row-Level Security
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.transactions enable row level security;
alter table public.cycles enable row level security;

-- 9. Row-Level Security Policies

-- Groups Policies
create policy "Users can view groups they are members of"
    on public.groups
    for select
    to authenticated
    using (public.is_member_of_group(id));

create policy "Authenticated users can create groups"
    on public.groups
    for insert
    to authenticated
    with check (true);

create policy "Treasurers can update their groups"
    on public.groups
    for update
    to authenticated
    using (public.is_treasurer_of_group(id))
    with check (public.is_treasurer_of_group(id));

create policy "Treasurers can delete their groups"
    on public.groups
    for delete
    to authenticated
    using (public.is_treasurer_of_group(id));

-- Members Policies
create policy "Members can view other members of their group"
    on public.members
    for select
    to authenticated
    using (public.is_member_of_group(group_id));

create policy "Treasurers can insert members into their group, or users can insert themselves"
    on public.members
    for insert
    to authenticated
    with check (
        public.is_treasurer_of_group(group_id) 
        or phone_number = auth.jwt() ->> 'phone'
    );

create policy "Treasurers can update members of their group"
    on public.members
    for update
    to authenticated
    using (public.is_treasurer_of_group(group_id))
    with check (public.is_treasurer_of_group(group_id));

create policy "Treasurers can delete members of their group"
    on public.members
    for delete
    to authenticated
    using (public.is_treasurer_of_group(group_id));

-- Transactions Policies
create policy "Members can view transactions in their groups"
    on public.transactions
    for select
    to authenticated
    using (
        public.is_treasurer_of_group(group_id) 
        or member_id in (
            select id from public.members 
            where phone_number = auth.jwt() ->> 'phone' 
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
                where phone_number = auth.jwt() ->> 'phone' 
                  and group_id = transactions.group_id
            )
            and status = 'pending'
            and type = 'contribution'
        )
    );

create policy "Treasurers can update transactions"
    on public.transactions
    for update
    to authenticated
    using (public.is_treasurer_of_group(group_id))
    with check (public.is_treasurer_of_group(group_id));

create policy "Treasurers can delete transactions"
    on public.transactions
    for delete
    to authenticated
    using (public.is_treasurer_of_group(group_id));

-- Cycles Policies
create policy "Members can view cycles in their groups"
    on public.cycles
    for select
    to authenticated
    using (public.is_member_of_group(group_id));

create policy "Treasurers can manage cycles in their groups"
    on public.cycles
    for all
    to authenticated
    using (public.is_treasurer_of_group(group_id))
    with check (public.is_treasurer_of_group(group_id));
