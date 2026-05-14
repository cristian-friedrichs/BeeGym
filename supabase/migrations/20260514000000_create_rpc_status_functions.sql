-- RPC functions to auto-update session/class statuses based on current time.
-- Called by the client on page load and every 60 seconds by StatusAutomator.

-- Marks calendar_events IN_PROGRESS while running, COMPLETED after end.
CREATE OR REPLACE FUNCTION public.update_class_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.calendar_events
    SET status = 'IN_PROGRESS'
    WHERE start_datetime <= NOW()
      AND (end_datetime IS NULL OR end_datetime >= NOW())
      AND status NOT IN ('CANCELLED', 'Cancelado', 'IN_PROGRESS', 'COMPLETED');

    UPDATE public.calendar_events
    SET status = 'COMPLETED'
    WHERE end_datetime IS NOT NULL
      AND end_datetime < NOW()
      AND status NOT IN ('CANCELLED', 'Cancelado', 'COMPLETED');
END;
$$;

-- Marks past calendar_events as COMPLETED (subset of update_class_statuses).
CREATE OR REPLACE FUNCTION public.update_finished_classes_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.calendar_events
    SET status = 'COMPLETED'
    WHERE end_datetime IS NOT NULL
      AND end_datetime < NOW()
      AND status NOT IN ('CANCELLED', 'Cancelado', 'COMPLETED');
END;
$$;

-- Updates both calendar_events and workouts statuses.
-- calendar_events: IN_PROGRESS while running, COMPLETED after end.
-- workouts: transitions scheduled/pending workouts to Em Execução when scheduled_at arrives.
CREATE OR REPLACE FUNCTION public.auto_update_session_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- calendar_events: mark running
    UPDATE public.calendar_events
    SET status = 'IN_PROGRESS'
    WHERE start_datetime <= NOW()
      AND (end_datetime IS NULL OR end_datetime >= NOW())
      AND status NOT IN ('CANCELLED', 'Cancelado', 'IN_PROGRESS', 'COMPLETED');

    -- calendar_events: mark finished
    UPDATE public.calendar_events
    SET status = 'COMPLETED'
    WHERE end_datetime IS NOT NULL
      AND end_datetime < NOW()
      AND status NOT IN ('CANCELLED', 'Cancelado', 'COMPLETED');

    -- workouts: mark as running when scheduled time arrives
    UPDATE public.workouts
    SET status = 'Em Execução'
    WHERE scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
      AND status IN ('Agendado', 'Agendada', 'Pendente', 'PENDING', 'SCHEDULED', 'Pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_class_statuses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_finished_classes_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_update_session_statuses() TO authenticated;
