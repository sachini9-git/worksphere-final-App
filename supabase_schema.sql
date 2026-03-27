
-- Users table (managed partially by Supabase Auth, but we track profile info here)
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Onboarding answers
create table public.onboarding (
  user_id uuid references public.users(id) primary key,
  study_area text,
  focus_time text,
  goals jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in-progress', 'done')) default 'todo',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  due_date timestamp with time zone,
  reminder timestamp with time zone,
  reminder_fired boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Folders for Documents
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  parent_id uuid references public.folders(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents & Notes
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  folder_id uuid references public.folders(id),
  title text not null,
  content text, -- Could be markdown or rich text html
  tags text[],
  type text default 'note', -- 'pdf', 'doc', 'note'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Focus Sessions (Pomodoro History)
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  duration_minutes integer not null,
  label text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.onboarding enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.focus_sessions enable row level security;

-- Policies (Simple example: users can only see their own data)
create policy "Users can view own data" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can view own documents" on public.documents for all using (auth.uid() = user_id);
create policy "Users can view own sessions" on public.focus_sessions for all using (auth.uid() = user_id);
create policy "Users can view own onboarding" on public.onboarding for all using (auth.uid() = user_id);
