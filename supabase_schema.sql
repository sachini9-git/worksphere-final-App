-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users table (managed partially by Supabase Auth, tracks profile info & XP)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  xp integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Onboarding table (stores study preferences and goals)
create table if not exists public.onboarding (
  user_id uuid references public.users(id) on delete cascade primary key,
  study_area text,
  focus_time text,
  goals jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tasks table (manages user tasks, priorities, and reminders)
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in-progress', 'done')) default 'todo',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  due_date timestamp with time zone,
  reminder timestamp with time zone,
  reminder_fired boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Folders for Documents
create table if not exists public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Documents & Notes
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  content text,
  tags text[],
  type text default 'note',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Focus Sessions (Pomodoro History)
create table if not exists public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  duration_minutes integer not null,
  label text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Enable Row Level Security (RLS) on all tables
alter table public.users enable row level security;
alter table public.onboarding enable row level security;
alter table public.tasks enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.focus_sessions enable row level security;

-- 8. Row Level Security Policies (Full CRUD for authenticated owners)
drop policy if exists "Users can manage own profile" on public.users;
create policy "Users can manage own profile" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage own onboarding" on public.onboarding;
create policy "Users can manage own onboarding" on public.onboarding for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own folders" on public.folders;
create policy "Users can manage own folders" on public.folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own documents" on public.documents;
create policy "Users can manage own documents" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own sessions" on public.focus_sessions;
create policy "Users can manage own sessions" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
