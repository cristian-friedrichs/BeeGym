-- Migration: 20260520000000_scheduling_credits_system.sql
-- Description: Implement tables, triggers, views and cron for Schedules, Credits and Status control.

-- 1. Add capacity and is_recurrence columns to calendar_events
ALTER TABLE public.calendar_events 
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_recurrence BOOLEAN DEFAULT false;

-- 2. Create / Update Pivot Table for Student Enrollments / Attendance (event_enrollments)
CREATE TABLE IF NOT EXISTS public.event_enrollments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Agendado' NOT NULL, -- 'Agendado', 'Realizado', 'Falta', 'Pendente', 'Cancelado'
    credit_type VARCHAR(20) DEFAULT 'Semanal' NOT NULL, -- 'Semanal', 'Extra', 'Avulso'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_event_student UNIQUE (event_id, student_id)
);

-- Ensure correct columns and defaults exist on event_enrollments if it already existed
ALTER TABLE public.event_enrollments ALTER COLUMN status SET DEFAULT 'Agendado';
ALTER TABLE public.event_enrollments ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'Semanal' NOT NULL;

-- Enable Row Level Security (RLS) on event_enrollments
ALTER TABLE public.event_enrollments ENABLE ROW LEVEL SECURITY;

-- 3. Create Table for Student Rollover Credits (student_credits)
CREATE TABLE IF NOT EXISTS public.student_credits (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    source_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
    used_in_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
    type VARCHAR(20) DEFAULT 'Extra' NOT NULL, -- 'Extra', 'Pacote'
    status VARCHAR(20) DEFAULT 'Disponivel' NOT NULL, -- 'Disponivel', 'Utilizado', 'Expirado'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) on student_credits
ALTER TABLE public.student_credits ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies for event_enrollments
CREATE POLICY "org_members_view_event_enrollments" ON public.event_enrollments
    FOR SELECT
    TO authenticated
    USING (organization_id = auth_user_org_id());

CREATE POLICY "staff_manage_event_enrollments" ON public.event_enrollments
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

-- 5. Set up RLS Policies for student_credits
CREATE POLICY "org_members_view_student_credits" ON public.student_credits
    FOR SELECT
    TO authenticated
    USING (organization_id = auth_user_org_id());

CREATE POLICY "staff_manage_student_credits" ON public.student_credits
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

-- 6. Trigger for updated_at on event_enrollments and student_credits
CREATE TRIGGER update_event_enrollments_updated_at 
BEFORE UPDATE ON public.event_enrollments 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_student_credits_updated_at 
BEFORE UPDATE ON public.student_credits 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 7. Trigger Function for Overbooking Validation (with Admin/Owner override)
CREATE OR REPLACE FUNCTION public.check_instructor_overbooking()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR;
    has_overlap BOOLEAN;
BEGIN
    -- Skip check if instructor_id is not set
    IF NEW.instructor_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Retrieve current user role
    user_role := public.auth_user_role();

    -- Check for overlap: NEW starts before existing ends, and NEW ends after existing starts
    SELECT EXISTS (
        SELECT 1 
        FROM public.calendar_events
        WHERE instructor_id = NEW.instructor_id
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND NEW.start_datetime < COALESCE(end_datetime, start_datetime + INTERVAL '1 hour')
          AND COALESCE(NEW.end_datetime, NEW.start_datetime + INTERVAL '1 hour') > start_datetime
    ) INTO has_overlap;

    -- Block only non-admins if overlap exists
    IF has_overlap AND COALESCE(user_role, '') NOT IN ('ADMIN', 'OWNER') THEN
        RAISE EXCEPTION 'Conflito de agenda: O instrutor já possui um treino agendado que se sobrepõe a este horário.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_instructor_overbooking
BEFORE INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE PROCEDURE public.check_instructor_overbooking();

-- 8. View of Events with dynamically computed Pending status
CREATE OR REPLACE VIEW public.vw_calendar_events_active AS
SELECT 
    ce.*,
    CASE 
        WHEN ce.status = 'Agendado' AND COALESCE(ce.end_datetime, ce.start_datetime + INTERVAL '1 hour') < NOW() - INTERVAL '1 minute' THEN 'Pendente'
        ELSE ce.status
    END AS computed_status
FROM public.calendar_events ce;

-- 9. pg_cron schedule for updates (only if pg_cron is available and configured)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.schedule(
            'update-pending-workouts-every-minute',
            '* * * * *',
            'UPDATE public.calendar_events SET status = ''Pendente'' WHERE status = ''Agendado'' AND COALESCE(end_datetime, start_datetime + INTERVAL ''1 hour'') < NOW() - INTERVAL ''1 minute'''
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron is enabled but could not schedule update job. View vw_calendar_events_active will handle computed status dynamically.';
END;
$$;

-- 10. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_event_enrollments_org_id ON public.event_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_enrollments_event_id ON public.event_enrollments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_enrollments_student_id ON public.event_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_credits_org_id ON public.student_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_credits_student_id ON public.student_credits(student_id);
CREATE INDEX IF NOT EXISTS idx_student_credits_expires_at ON public.student_credits(expires_at) WHERE status = 'Disponivel';

-- 11. FIFO Credit Trigger Functions
CREATE OR REPLACE FUNCTION public.handle_enrollment_credits_fifo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_credit_id uuid;
  v_count int;
  v_limit int;
  v_week_start date;
  v_week_end date;
  v_event_date date;
  v_plan_type text;
  v_enrollment_count int;
  v_workout_count int;
  v_total_used int;
BEGIN
  -- 1. On INSERT or status change TO non-Cancelado:
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status != 'Cancelado' AND OLD.status = 'Cancelado') THEN
    -- Get start datetime of the calendar event
    SELECT (start_datetime AT TIME ZONE 'America/Sao_Paulo')::date 
    INTO v_event_date 
    FROM public.calendar_events 
    WHERE id = NEW.event_id;

    -- Calculate Sunday-Saturday boundaries in America/Sao_Paulo timezone
    v_week_start := v_event_date - EXTRACT(DOW FROM v_event_date)::integer;
    v_week_end := v_week_start + 6;

    -- Fetch current plan details
    SELECT mp.plan_type, mp.days_per_week
    INTO v_plan_type, v_limit
    FROM public.students s
    JOIN public.membership_plans mp ON s.plan_id = mp.id
    WHERE s.id = NEW.student_id;

    -- Calculate usage of weekly limit (classes + workouts)
    IF v_plan_type = 'membership' AND v_limit IS NOT NULL AND v_limit > 0 THEN
      -- Count weekly classes scheduled as 'Semanal'
      SELECT count(*) INTO v_enrollment_count
      FROM public.event_enrollments ee
      JOIN public.calendar_events ce ON ee.event_id = ce.id
      WHERE ee.student_id = NEW.student_id
        AND ee.credit_type = 'Semanal'
        AND ee.status != 'Cancelado'
        AND (ce.start_datetime AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end
        AND ee.id != NEW.id;

      -- Count weekly workouts (excluding makeup)
      SELECT count(*) INTO v_workout_count
      FROM public.workouts w
      WHERE w.student_id = NEW.student_id
        AND w.is_makeup = false
        AND w.status != 'Cancelado'
        AND (w.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end;

      v_total_used := v_enrollment_count + v_workout_count;

      IF v_total_used < v_limit THEN
        -- There is weekly quota available
        NEW.credit_type := 'Semanal';
        RETURN NEW;
      END IF;
    END IF;

    -- Use Extra Credit (FIFO)
    SELECT id INTO v_credit_id
    FROM public.student_credits
    WHERE student_id = NEW.student_id
      AND status = 'Disponivel'
      AND expires_at > now()
    ORDER BY expires_at ASC, created_at ASC
    LIMIT 1;

    IF v_credit_id IS NOT NULL THEN
      UPDATE public.student_credits
      SET status = 'Utilizado', updated_at = now()
      WHERE id = v_credit_id;

      NEW.credit_type := 'Extra';
      NEW.student_credit_id := v_credit_id;
    ELSE
      -- No credits available, fallback or error if weekly quota exceeded
      IF v_plan_type = 'membership' THEN
        NEW.credit_type := 'Semanal';
      ELSE
        NEW.credit_type := 'Extra';
      END IF;
    END IF;

  -- 2. On DELETE or status change TO Cancelado:
  ELSIF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'Cancelado' AND OLD.status != 'Cancelado') THEN
    -- If it used an extra credit, refund it (FIFO)
    IF OLD.student_credit_id IS NOT NULL THEN
      UPDATE public.student_credits
      SET status = 'Disponivel', updated_at = now()
      WHERE id = OLD.student_credit_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_workout_credits_fifo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_credit_id uuid;
  v_limit int;
  v_week_start date;
  v_week_end date;
  v_workout_date date;
  v_plan_type text;
  v_enrollment_count int;
  v_workout_count int;
  v_total_used int;
BEGIN
  -- Only care about standard non-makeup workouts
  IF NEW.is_makeup = true THEN
    RETURN NEW;
  END IF;

  -- 1. On INSERT or status change TO non-Cancelado:
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.status != 'Cancelado' AND OLD.status = 'Cancelado') THEN
    v_workout_date := (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date;

    -- Calculate Sunday-Saturday boundaries in America/Sao_Paulo timezone
    v_week_start := v_workout_date - EXTRACT(DOW FROM v_workout_date)::integer;
    v_week_end := v_week_start + 6;

    -- Fetch current plan details
    SELECT mp.plan_type, mp.days_per_week
    INTO v_plan_type, v_limit
    FROM public.students s
    JOIN public.membership_plans mp ON s.plan_id = mp.id
    WHERE s.id = NEW.student_id;

    -- Calculate usage of weekly limit
    IF v_plan_type = 'membership' AND v_limit IS NOT NULL AND v_limit > 0 THEN
      -- Count weekly classes scheduled as 'Semanal'
      SELECT count(*) INTO v_enrollment_count
      FROM public.event_enrollments ee
      JOIN public.calendar_events ce ON ee.event_id = ce.id
      WHERE ee.student_id = NEW.student_id
        AND ee.credit_type = 'Semanal'
        AND ee.status != 'Cancelado'
        AND (ce.start_datetime AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end;

      -- Count weekly workouts (excluding makeup)
      SELECT count(*) INTO v_workout_count
      FROM public.workouts w
      WHERE w.student_id = NEW.student_id
        AND w.is_makeup = false
        AND w.status != 'Cancelado'
        AND (w.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN v_week_start AND v_week_end
        AND w.id != NEW.id;

      v_total_used := v_enrollment_count + v_workout_count;

      IF v_total_used < v_limit THEN
        -- Weekly quota available
        NEW.credit_type := 'Semanal';
        RETURN NEW;
      END IF;
    END IF;

    -- Use Extra Credit (FIFO)
    SELECT id INTO v_credit_id
    FROM public.student_credits
    WHERE student_id = NEW.student_id
      AND status = 'Disponivel'
      AND expires_at > now()
    ORDER BY expires_at ASC, created_at ASC
    LIMIT 1;

    IF v_credit_id IS NOT NULL THEN
      UPDATE public.student_credits
      SET status = 'Utilizado', updated_at = now()
      WHERE id = v_credit_id;

      NEW.credit_type := 'Extra';
      NEW.student_credit_id := v_credit_id;
    ELSE
      -- No credits available, fallback or error if weekly quota exceeded
      IF v_plan_type = 'membership' THEN
        NEW.credit_type := 'Semanal';
      ELSE
        NEW.credit_type := 'Extra';
      END IF;
    END IF;

  -- 2. On DELETE or status change TO Cancelado:
  ELSIF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'Cancelado' AND OLD.status != 'Cancelado') THEN
    -- If it used an extra credit, refund it
    IF OLD.student_credit_id IS NOT NULL THEN
      UPDATE public.student_credits
      SET status = 'Disponivel', updated_at = now()
      WHERE id = OLD.student_credit_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE TRIGGER trg_enrollment_credits_fifo
BEFORE INSERT OR UPDATE OF status OR DELETE
ON public.event_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.handle_enrollment_credits_fifo();

CREATE TRIGGER trg_workout_credits_fifo
BEFORE INSERT OR UPDATE OF status OR DELETE
ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.handle_workout_credits_fifo();

-- 12. View for excess workouts due to Downgrade
CREATE OR REPLACE VIEW public.vw_students_excess_workouts AS
SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    s.organization_id,
    w.week_start,
    w.scheduled_count,
    mp.days_per_week AS allowed_count
FROM public.students s
JOIN public.membership_plans mp ON s.plan_id = mp.id
CROSS JOIN LATERAL (
    SELECT 
        (date_trunc('day', coalesce(ce.start_datetime, wo.scheduled_at) AT TIME ZONE 'America/Sao_Paulo') - (extract(dow from coalesce(ce.start_datetime, wo.scheduled_at) AT TIME ZONE 'America/Sao_Paulo') || ' days')::interval) AT TIME ZONE 'America/Sao_Paulo' AS week_start,
        count(*) as scheduled_count
    FROM (
        SELECT ee.student_id, ee.event_id, null::uuid as workout_id
        FROM public.event_enrollments ee
        WHERE ee.status != 'Cancelado' AND ee.credit_type = 'Semanal'
        UNION ALL
        SELECT wo.student_id, null::uuid as event_id, wo.id as workout_id
        FROM public.workouts wo
        WHERE wo.status != 'Cancelado' AND wo.is_makeup = false
    ) t
    LEFT JOIN public.calendar_events ce ON t.event_id = ce.id
    LEFT JOIN public.workouts wo ON t.workout_id = wo.id
    WHERE t.student_id = s.id
      AND coalesce(ce.start_datetime, wo.scheduled_at) >= (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') - (extract(dow from NOW() AT TIME ZONE 'America/Sao_Paulo') || ' days')::interval) AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY 1
) w 
WHERE mp.plan_type = 'membership' 
  AND mp.days_per_week > 0 
  AND w.scheduled_count > mp.days_per_week;

