-- Create Organization with business_type and valid UUID
INSERT INTO organizations (id, name, business_type, created_at, updated_at)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BeeGym Default', 'personal', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create Profile for Cristian (Role: admin, Status: ACTIVE)
INSERT INTO profiles (id, organization_id, full_name, role, email, status, created_at)
VALUES (
  'e1e3b770-9014-45cc-8c8b-9679158e440e',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Cristian Friedrichs',
  'admin',
  'cristian_friedrichs@live.com',
  'ACTIVE',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;
