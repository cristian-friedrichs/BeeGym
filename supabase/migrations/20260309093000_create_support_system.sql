-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Tickets Policies
-- Admins can do everything
CREATE POLICY "Admins can view and manage all tickets" ON public.support_tickets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'BEEGYM_ADMIN'
        )
    );

-- Owners can view their own tickets
CREATE POLICY "Owners can view their own tickets" ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Owners can create their own tickets
CREATE POLICY "Owners can create their own tickets" ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Messages Policies
-- Admins can do everything
CREATE POLICY "Admins can view and manage all messages" ON public.support_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'BEEGYM_ADMIN'
        )
    );

-- Users can view messages in their own tickets
CREATE POLICY "Users can view messages in their own tickets" ON public.support_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE public.support_tickets.id = ticket_id AND public.support_tickets.user_id = auth.uid()
        )
    );

-- Users can create messages in their own tickets
CREATE POLICY "Users can create messages in their own tickets" ON public.support_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE public.support_tickets.id = ticket_id AND public.support_tickets.user_id = auth.uid()
        ) AND sender_id = auth.uid()
    );

-- Storage Bucket for attachments (Schema storage is managed by Supabase)
-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for bucket
CREATE POLICY "Support attachments are accessible by owner and admin" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'support-attachments' AND (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'BEEGYM_ADMIN'
            )
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at 
BEFORE UPDATE ON public.support_tickets 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
