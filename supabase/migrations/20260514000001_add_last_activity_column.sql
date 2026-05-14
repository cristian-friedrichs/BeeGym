-- Convert last_activity from a computed PostgREST function to a real stored column.
-- The old function referenced legacy tables (classes, class_attendees) that no longer exist,
-- and computed columns cannot be used in WHERE clause filters (causes 404 from PostgREST).

-- 1. Add the real column
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;

-- 2. Backfill from existing completed workouts and confirmed enrollments
UPDATE public.students s
SET last_activity = sub.max_date
FROM (
    SELECT student_id, MAX(activity_date) AS max_date
    FROM (
        SELECT student_id, scheduled_at AS activity_date
        FROM public.workouts
        WHERE status IN ('Concluido', 'COMPLETED', 'Realizado')
          AND scheduled_at IS NOT NULL

        UNION ALL

        SELECT ee.student_id, ce.start_datetime AS activity_date
        FROM public.event_enrollments ee
        JOIN public.calendar_events ce ON ce.id = ee.event_id
        WHERE ee.status IN ('PRESENT', 'CONFIRMED', 'Confirmado', 'ATTENDED')
           OR ce.status IN ('COMPLETED', 'Concluido', 'REALIZADA', 'Realizado')
    ) AS activities
    GROUP BY student_id
) sub
WHERE s.id = sub.student_id;

-- 3. Drop the old computed function (shadowed by the real column anyway)
DROP FUNCTION IF EXISTS public.last_activity(students);

-- 4. Trigger function to keep the column up to date
CREATE OR REPLACE FUNCTION public.refresh_student_last_activity_from_workout()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('Concluido', 'COMPLETED', 'Realizado') AND NEW.scheduled_at IS NOT NULL THEN
        UPDATE public.students
        SET last_activity = GREATEST(COALESCE(last_activity, NEW.scheduled_at), NEW.scheduled_at)
        WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.refresh_student_last_activity_from_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('PRESENT', 'CONFIRMED', 'Confirmado', 'ATTENDED') THEN
        UPDATE public.students s
        SET last_activity = GREATEST(COALESCE(s.last_activity, ce.start_datetime), ce.start_datetime)
        FROM public.calendar_events ce
        WHERE ce.id = NEW.event_id AND s.id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach triggers
CREATE TRIGGER trg_last_activity_workout
AFTER INSERT OR UPDATE OF status ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.refresh_student_last_activity_from_workout();

CREATE TRIGGER trg_last_activity_enrollment
AFTER INSERT OR UPDATE OF status ON public.event_enrollments
FOR EACH ROW EXECUTE FUNCTION public.refresh_student_last_activity_from_enrollment();
