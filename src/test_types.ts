import { Database } from './types/supabase';

type Profiles = Database['public']['Tables']['profiles']['Row'];
const p: Profiles = {
    id: '1',
    full_name: 'Test',
    organization_id: 'org1',
    // and so on
} as any;

