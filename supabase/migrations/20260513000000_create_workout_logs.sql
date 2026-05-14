-- Create workout_logs table for tracking exercise history
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
    sets INTEGER,
    reps TEXT,
    weight NUMERIC,
    rpe INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Members of the organization can view logs
CREATE POLICY "org_members_view_workout_logs" ON public.workout_logs
    FOR SELECT
    TO authenticated
    USING (organization_id = auth_user_org_id());

-- Staff (Admin/Instructor) can manage logs
CREATE POLICY "staff_manage_workout_logs" ON public.workout_logs
    FOR ALL
    TO authenticated
    USING (
        organization_id = auth_user_org_id() 
        AND auth_user_role() IN ('ADMIN', 'INSTRUCTOR', 'OWNER')
    )
    WITH CHECK (
        organization_id = auth_user_org_id() 
        AND auth_user_role() IN ('ADMIN', 'INSTRUCTOR', 'OWNER')
    );

-- Trigger for updated_at
CREATE TRIGGER update_workout_logs_updated_at 
BEFORE UPDATE ON public.workout_logs 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_org_id ON public.workout_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_student_id ON public.workout_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise_id ON public.workout_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_event_id ON public.workout_logs(event_id);

-- Add comments for documentation
COMMENT ON TABLE public.workout_logs IS 'Tracks individual exercise performance history for students.';
COMMENT ON COLUMN public.workout_logs.rpe IS 'Rate of Perceived Exertion (1-10 scale).';
COMMENT ON COLUMN public.workout_logs.event_id IS 'Reference to the class/event where this log was recorded.';
