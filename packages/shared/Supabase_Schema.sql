-- conversations table for text messages
create table conversations (
    id uuid primary key default uuid_generate_v4(),
    participants uuid[] not null,
    type text not null,
    created_at timestamptz default now(),
    last_activity timestamptz
);
-- messages table for text messages
create table messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid references conversations(id) not null,
    sender_id uuid references users(id) not null,
    content text not null,
    timestamp timestamptz default now(),
    status text not null,
    type text not null,
    metadata jsonb
);
-- calls table for audio and video calls
create table calls (
    id uuid primary key default uuid_generate_v4(),
    caller_id uuid references users(id) not null,
    receiver_id uuid references users(id) not null,
    start_time timestamptz default now(),
    end_time timestamptz,
    status text not null,
    type text not null,
    call_duration integer
);
-- notifications table for push notifications
create table notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) not null,
    type text not null,
    title text not null,
    body text not null,
    read boolean default false,
    created_at timestamptz default now(),
    metadata jsonb
);

