-- ============================================================================
-- PARTE 1: CORREÃ‡Ã•ES CRÃTICAS DE SCHEMA
-- ============================================================================

-- 1.1 Adicionar organization_id nas tabelas faltantes
-- ====================================
ALTER TABLE IF EXISTS physical_assessments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE IF EXISTS workout_logs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE IF EXISTS workout_execution ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE IF EXISTS workout_executions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- 1.2 Popular organization_id nas tabelas corrigidas
-- ====================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'physical_assessments') THEN
    UPDATE physical_assessments pa SET organization_id = s.organization_id FROM students s WHERE pa.student_id = s.id AND pa.organization_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_logs') THEN
    UPDATE workout_logs wl SET organization_id = s.organization_id FROM students s WHERE wl.student_id = s.id AND wl.organization_id IS NULL;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_execution') THEN
    UPDATE workout_execution we SET organization_id = w.organization_id FROM workouts w WHERE we.workout_id = w.id AND we.organization_id IS NULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_executions') THEN
    UPDATE workout_executions we SET organization_id = w.organization_id FROM workouts w WHERE we.workout_id = w.id AND we.organization_id IS NULL;
  END IF;
END $$;

-- 1.3 Corrigir constraint de email duplicado na tabela users
-- ====================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Remover constraint UNIQUE global
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    
    -- Adicionar constraint UNIQUE por organization se nÃ£o existir
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_org_unique') THEN
      ALTER TABLE users ADD CONSTRAINT users_email_org_unique UNIQUE (email, organization_id);
    END IF;
  END IF;
END $$;

-- 1.4 Adicionar Ã­ndices para performance
-- ====================================
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_org_id ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_workouts_org_id ON workouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_classes_org_id ON classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_chats_org_id ON chats(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_participant_id ON chat_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);

COMMENT ON INDEX idx_profiles_org_id IS 'Performance: Filtrar usuÃ¡rios por organizaÃ§Ã£o';
COMMENT ON INDEX idx_chat_participants_participant_id IS 'Performance: Buscar chats do usuÃ¡rio';

-- ============================================================================
-- PARTE 2: ATIVAR ROW LEVEL SECURITY
-- ============================================================================

DO $$
DECLARE
    t_name text;
    tables_list text[] := ARRAY['organizations', 'profiles', 'users', 'units', 'students', 'student_medical_records', 'student_measurements', 'student_plan_history', 'student_credits_log', 'instructors', 'membership_plans', 'plans', 'rooms', 'exercises', 'workouts', 'workout_exercises', 'workout_executions', 'workout_logs', 'classes', 'class_templates', 'class_attendees', 'calendar_events', 'event_enrollments', 'chats', 'chat_participants', 'chat_messages', 'invoices', 'financial_summary', 'notifications', 'app_roles', 'system_logs'];
BEGIN
    FOREACH t_name IN ARRAY tables_list
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = t_name) THEN
            EXECUTE 'ALTER TABLE ' || t_name || ' ENABLE ROW LEVEL SECURITY;';
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- ============================================================================
-- FUNÇÕES DE SUPORTE PARA RLS (Performance & Segurança)
-- ============================================================================
CREATE OR REPLACE FUNCTION auth_user_org_id() RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT organization_id FROM profiles WHERE id = auth.uid(); $$;
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT role FROM profiles WHERE id = auth.uid(); $$;
-- PARTE 3: ORGANIZATIONS E PROFILES (Base da SeguranÃ§a)
-- ============================================================================

-- Function to drop policy if exists to make script rerunnable
CREATE OR REPLACE FUNCTION drop_policy_if_exists(p_name text, t_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_name, t_name);
END;
$$ LANGUAGE plpgsql;

-- ORGANIZATIONS
SELECT drop_policy_if_exists('users_view_own_organization', 'organizations');
CREATE POLICY "users_view_own_organization" ON organizations FOR SELECT TO authenticated USING (id IN auth_user_org_id());

SELECT drop_policy_if_exists('admins_update_own_organization', 'organizations');
CREATE POLICY "admins_update_own_organization" ON organizations FOR UPDATE TO authenticated USING (id IN (SELECT auth_user_org_id() WHERE auth_user_role() IN ('ADMIN', 'OWNER'))) WITH CHECK (id IN (SELECT auth_user_org_id() WHERE auth_user_role() IN ('ADMIN', 'OWNER')));

-- PROFILES
SELECT drop_policy_if_exists('users_view_own_profile', 'profiles');
CREATE POLICY "users_view_own_profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

SELECT drop_policy_if_exists('users_view_org_profiles', 'profiles');
CREATE POLICY "users_view_org_profiles" ON profiles FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id() AND show_public_profile = true);

SELECT drop_policy_if_exists('users_update_own_profile', 'profiles');
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

SELECT drop_policy_if_exists('admins_create_users', 'profiles');
CREATE POLICY "admins_create_users" ON profiles FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() = 'ADMIN'));

SELECT drop_policy_if_exists('admins_delete_users', 'profiles');
CREATE POLICY "admins_delete_users" ON profiles FOR DELETE TO authenticated USING (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() = 'ADMIN') AND id != auth.uid());

-- USERS (Tabela Legada)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    PERFORM drop_policy_if_exists('users_view_org_users', 'users');
    EXECUTE 'CREATE POLICY "users_view_org_users" ON users FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_users', 'users');
    EXECUTE 'CREATE POLICY "admins_manage_users" ON users FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- ============================================================================
-- PARTE 4: STUDENTS E DADOS RELACIONADOS
-- ============================================================================

-- STUDENTS
SELECT drop_policy_if_exists('org_members_view_students', 'students');
CREATE POLICY "org_members_view_students" ON students FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());

SELECT drop_policy_if_exists('admins_instructors_create_students', 'students');
CREATE POLICY "admins_instructors_create_students" ON students FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() IN ('ADMIN', 'INSTRUCTOR')));

SELECT drop_policy_if_exists('admins_instructors_update_students', 'students');
CREATE POLICY "admins_instructors_update_students" ON students FOR UPDATE TO authenticated USING (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() IN ('ADMIN', 'INSTRUCTOR'))) WITH CHECK (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() IN ('ADMIN', 'INSTRUCTOR')));

SELECT drop_policy_if_exists('admins_delete_students', 'students');
CREATE POLICY "admins_delete_students" ON students FOR DELETE TO authenticated USING (organization_id IN (SELECT auth_user_org_id() WHERE auth_user_role() = 'ADMIN'));

-- STUDENT_MEDICAL_RECORDS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_medical_records') THEN
    PERFORM drop_policy_if_exists('restricted_view_medical_records', 'student_medical_records');
    EXECUTE 'CREATE POLICY "restricted_view_medical_records" ON student_medical_records FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s INNER JOIN profiles p ON p.organization_id = s.organization_id WHERE p.id = auth.uid() AND p.role IN (''ADMIN'', ''INSTRUCTOR'')));';

    PERFORM drop_policy_if_exists('restricted_modify_medical_records', 'student_medical_records');
    EXECUTE 'CREATE POLICY "restricted_modify_medical_records" ON student_medical_records FOR ALL TO authenticated USING (student_id IN (SELECT s.id FROM students s INNER JOIN profiles p ON p.organization_id = s.organization_id WHERE p.id = auth.uid() AND p.role IN (''ADMIN'', ''INSTRUCTOR''))) WITH CHECK (student_id IN (SELECT s.id FROM students s INNER JOIN profiles p ON p.organization_id = s.organization_id WHERE p.id = auth.uid() AND p.role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- STUDENT_MEASUREMENTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_measurements') THEN
    PERFORM drop_policy_if_exists('restricted_view_measurements', 'student_measurements');
    EXECUTE 'CREATE POLICY "restricted_view_measurements" ON student_measurements FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';

    PERFORM drop_policy_if_exists('restricted_manage_measurements', 'student_measurements');
    EXECUTE 'CREATE POLICY "restricted_manage_measurements" ON student_measurements FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR''))) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- STUDENT_PLAN_HISTORY
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_plan_history') THEN
    PERFORM drop_policy_if_exists('org_members_view_plan_history', 'student_plan_history');
    EXECUTE 'CREATE POLICY "org_members_view_plan_history" ON student_plan_history FOR SELECT TO authenticated USING (student_id IN (SELECT id FROM students WHERE organization_id IN auth_user_org_id()));';

    PERFORM drop_policy_if_exists('admins_manage_plan_history', 'student_plan_history');
    EXECUTE 'CREATE POLICY "admins_manage_plan_history" ON student_plan_history FOR ALL TO authenticated USING (student_id IN (SELECT id FROM students WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'')));';
  END IF;
END $$;

-- STUDENT_CREDITS_LOG
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_credits_log') THEN
    PERFORM drop_policy_if_exists('org_members_view_credits_log', 'student_credits_log');
    EXECUTE 'CREATE POLICY "org_members_view_credits_log" ON student_credits_log FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_credits_log', 'student_credits_log');
    EXECUTE 'CREATE POLICY "admins_manage_credits_log" ON student_credits_log FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- ============================================================================
-- PARTE 5: CHATS E MENSAGENS
-- ============================================================================

-- CHATS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chats') THEN
    PERFORM drop_policy_if_exists('users_view_org_chats', 'chats');
    EXECUTE 'CREATE POLICY "users_view_org_chats" ON chats FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('users_create_org_chats', 'chats');
    EXECUTE 'CREATE POLICY "users_create_org_chats" ON chats FOR INSERT TO authenticated WITH CHECK (organization_id IN auth_user_org_id());';
  END IF;
END $$;

-- CHAT_PARTICIPANTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
    PERFORM drop_policy_if_exists('users_view_own_chat_participation', 'chat_participants');
    EXECUTE 'CREATE POLICY "users_view_own_chat_participation" ON chat_participants FOR SELECT TO authenticated USING (participant_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'' AND organization_id IN (SELECT organization_id FROM chats WHERE id = chat_participants.chat_id)));';

    PERFORM drop_policy_if_exists('users_manage_chat_participation', 'chat_participants');
    EXECUTE 'CREATE POLICY "users_manage_chat_participation" ON chat_participants FOR ALL TO authenticated USING (participant_id = auth.uid() OR chat_id IN (SELECT id FROM chats WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'')));';
  END IF;
END $$;

-- CHAT_MESSAGES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    PERFORM drop_policy_if_exists('only_participants_view_messages', 'chat_messages');
    EXECUTE 'CREATE POLICY "only_participants_view_messages" ON chat_messages FOR SELECT TO authenticated USING (chat_id IN (SELECT chat_id FROM chat_participants WHERE participant_id = auth.uid()));';

    PERFORM drop_policy_if_exists('only_participants_send_messages', 'chat_messages');
    EXECUTE 'CREATE POLICY "only_participants_send_messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND chat_id IN (SELECT chat_id FROM chat_participants WHERE participant_id = auth.uid()));';

    PERFORM drop_policy_if_exists('sender_updates_own_messages', 'chat_messages');
    EXECUTE 'CREATE POLICY "sender_updates_own_messages" ON chat_messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());';

    PERFORM drop_policy_if_exists('sender_deletes_own_messages', 'chat_messages');
    EXECUTE 'CREATE POLICY "sender_deletes_own_messages" ON chat_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());';
  END IF;
END $$;

-- ============================================================================
-- PARTE 6: DADOS FINANCEIROS
-- ============================================================================

-- INVOICES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
    PERFORM drop_policy_if_exists('admins_view_invoices', 'invoices');
    EXECUTE 'CREATE POLICY "admins_view_invoices" ON invoices FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';

    PERFORM drop_policy_if_exists('admins_manage_invoices', 'invoices');
    EXECUTE 'CREATE POLICY "admins_manage_invoices" ON invoices FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'')) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- FINANCIAL_SUMMARY
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_summary') THEN
    PERFORM drop_policy_if_exists('admins_view_financial_summary', 'financial_summary');
    EXECUTE 'CREATE POLICY "admins_view_financial_summary" ON financial_summary FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';

    PERFORM drop_policy_if_exists('admins_manage_financial_summary', 'financial_summary');
    EXECUTE 'CREATE POLICY "admins_manage_financial_summary" ON financial_summary FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- MEMBERSHIP_PLANS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'membership_plans') THEN
    PERFORM drop_policy_if_exists('org_members_view_plans', 'membership_plans');
    EXECUTE 'CREATE POLICY "org_members_view_plans" ON membership_plans FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_plans', 'membership_plans');
    EXECUTE 'CREATE POLICY "admins_manage_plans" ON membership_plans FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'')) WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- PLANS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plans') THEN
    PERFORM drop_policy_if_exists('org_members_view_old_plans', 'plans');
    EXECUTE 'CREATE POLICY "org_members_view_old_plans" ON plans FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id() OR organization_id IS NULL);';

    PERFORM drop_policy_if_exists('admins_manage_old_plans', 'plans');
    EXECUTE 'CREATE POLICY "admins_manage_old_plans" ON plans FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'') OR organization_id IS NULL);';
  END IF;
END $$;

-- ============================================================================
-- PARTE 7: WORKOUTS E EXERCÃCIOS
-- ============================================================================

-- EXERCISES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exercises') THEN
    PERFORM drop_policy_if_exists('org_members_view_exercises', 'exercises');
    EXECUTE 'CREATE POLICY "org_members_view_exercises" ON exercises FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id() OR organization_id IS NULL);';

    PERFORM drop_policy_if_exists('staff_manage_exercises', 'exercises');
    EXECUTE 'CREATE POLICY "staff_manage_exercises" ON exercises FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')) OR organization_id IS NULL);';
  END IF;
END $$;

-- WORKOUTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workouts') THEN
    PERFORM drop_policy_if_exists('org_members_view_workouts', 'workouts');
    EXECUTE 'CREATE POLICY "org_members_view_workouts" ON workouts FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_workouts', 'workouts');
    EXECUTE 'CREATE POLICY "staff_manage_workouts" ON workouts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- WORKOUT_EXERCISES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_exercises') THEN
    PERFORM drop_policy_if_exists('org_members_view_workout_exercises', 'workout_exercises');
    EXECUTE 'CREATE POLICY "org_members_view_workout_exercises" ON workout_exercises FOR SELECT TO authenticated USING (workout_id IN (SELECT id FROM workouts WHERE organization_id IN auth_user_org_id()));';

    PERFORM drop_policy_if_exists('staff_manage_workout_exercises', 'workout_exercises');
    EXECUTE 'CREATE POLICY "staff_manage_workout_exercises" ON workout_exercises FOR ALL TO authenticated USING (workout_id IN (SELECT id FROM workouts WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR''))));';
  END IF;
END $$;

-- WORKOUT_EXECUTIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_executions') THEN
    PERFORM drop_policy_if_exists('org_members_view_workout_executions', 'workout_executions');
    EXECUTE 'CREATE POLICY "org_members_view_workout_executions" ON workout_executions FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_workout_executions', 'workout_executions');
    EXECUTE 'CREATE POLICY "staff_manage_workout_executions" ON workout_executions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- WORKOUT_LOGS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workout_logs') THEN
    PERFORM drop_policy_if_exists('org_members_view_workout_logs', 'workout_logs');
    EXECUTE 'CREATE POLICY "org_members_view_workout_logs" ON workout_logs FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_workout_logs', 'workout_logs');
    EXECUTE 'CREATE POLICY "staff_manage_workout_logs" ON workout_logs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- ============================================================================
-- PARTE 8: CLASSES E CALENDAR EVENTS
-- ============================================================================

-- CLASSES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'classes') THEN
    PERFORM drop_policy_if_exists('org_members_view_classes', 'classes');
    EXECUTE 'CREATE POLICY "org_members_view_classes" ON classes FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_classes', 'classes');
    EXECUTE 'CREATE POLICY "staff_manage_classes" ON classes FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- CLASS_TEMPLATES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_templates') THEN
    PERFORM drop_policy_if_exists('org_members_view_class_templates', 'class_templates');
    EXECUTE 'CREATE POLICY "org_members_view_class_templates" ON class_templates FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_class_templates', 'class_templates');
    EXECUTE 'CREATE POLICY "admins_manage_class_templates" ON class_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- CLASS_ATTENDEES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_attendees') THEN
    PERFORM drop_policy_if_exists('org_members_view_class_attendees', 'class_attendees');
    EXECUTE 'CREATE POLICY "org_members_view_class_attendees" ON class_attendees FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_class_attendees', 'class_attendees');
    EXECUTE 'CREATE POLICY "staff_manage_class_attendees" ON class_attendees FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- CALENDAR_EVENTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    PERFORM drop_policy_if_exists('org_members_view_calendar_events', 'calendar_events');
    EXECUTE 'CREATE POLICY "org_members_view_calendar_events" ON calendar_events FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_calendar_events', 'calendar_events');
    EXECUTE 'CREATE POLICY "staff_manage_calendar_events" ON calendar_events FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- EVENT_ENROLLMENTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_enrollments') THEN
    PERFORM drop_policy_if_exists('org_members_view_event_enrollments', 'event_enrollments');
    EXECUTE 'CREATE POLICY "org_members_view_event_enrollments" ON event_enrollments FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('staff_manage_event_enrollments', 'event_enrollments');
    EXECUTE 'CREATE POLICY "staff_manage_event_enrollments" ON event_enrollments FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN (''ADMIN'', ''INSTRUCTOR'')));';
  END IF;
END $$;

-- ============================================================================
-- PARTE 9: UNITS, ROOMS, INSTRUCTORS
-- ============================================================================

-- UNITS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units') THEN
    PERFORM drop_policy_if_exists('org_members_view_units', 'units');
    EXECUTE 'CREATE POLICY "org_members_view_units" ON units FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_units', 'units');
    EXECUTE 'CREATE POLICY "admins_manage_units" ON units FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- ROOMS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rooms') THEN
    PERFORM drop_policy_if_exists('org_members_view_rooms', 'rooms');
    EXECUTE 'CREATE POLICY "org_members_view_rooms" ON rooms FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_rooms', 'rooms');
    EXECUTE 'CREATE POLICY "admins_manage_rooms" ON rooms FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- INSTRUCTORS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instructors') THEN
    PERFORM drop_policy_if_exists('org_members_view_instructors', 'instructors');
    EXECUTE 'CREATE POLICY "org_members_view_instructors" ON instructors FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_instructors', 'instructors');
    EXECUTE 'CREATE POLICY "admins_manage_instructors" ON instructors FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- ============================================================================
-- PARTE 10: NOTIFICATIONS, LOGS, ROLES
-- ============================================================================

-- NOTIFICATIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    PERFORM drop_policy_if_exists('users_view_own_notifications', 'notifications');
    EXECUTE 'CREATE POLICY "users_view_own_notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());';

    PERFORM drop_policy_if_exists('system_creates_notifications', 'notifications');
    EXECUTE 'CREATE POLICY "system_creates_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''ADMIN'' AND organization_id = notifications.organization_id));';

    PERFORM drop_policy_if_exists('users_update_own_notifications', 'notifications');
    EXECUTE 'CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());';

    PERFORM drop_policy_if_exists('users_delete_own_notifications', 'notifications');
    EXECUTE 'CREATE POLICY "users_delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());';
  END IF;
END $$;

-- SYSTEM_LOGS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    PERFORM drop_policy_if_exists('admins_view_system_logs', 'system_logs');
    EXECUTE 'CREATE POLICY "admins_view_system_logs" ON system_logs FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';

    PERFORM drop_policy_if_exists('authenticated_create_system_logs', 'system_logs');
    EXECUTE 'CREATE POLICY "authenticated_create_system_logs" ON system_logs FOR INSERT TO authenticated WITH CHECK (organization_id IN auth_user_org_id());';
  END IF;
END $$;

-- APP_ROLES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_roles') THEN
    PERFORM drop_policy_if_exists('org_members_view_roles', 'app_roles');
    EXECUTE 'CREATE POLICY "org_members_view_roles" ON app_roles FOR SELECT TO authenticated USING (organization_id IN auth_user_org_id());';

    PERFORM drop_policy_if_exists('admins_manage_roles', 'app_roles');
    EXECUTE 'CREATE POLICY "admins_manage_roles" ON app_roles FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = ''ADMIN''));';
  END IF;
END $$;

-- DROP FUNCTION CLEANUP (Optional)
-- DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);

