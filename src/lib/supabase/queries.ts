import { supabase } from './client'
import { useAuth } from '@/lib/auth/AuthContext'

/**
 * 🔒 SEMPRE adiciona organization_id automaticamente nas queries
 * Isso é uma camada extra de proteção além do RLS
 */
export function useSecureQuery() {
    const { organizationId } = useAuth()

    const from = (table: string) => {
        if (!organizationId) {
            throw new Error('🚨 SECURITY: Tentativa de query sem organization_id')
        }

        return {
            select: (columns = '*') => {
                return (supabase as any)
                    .from(table)
                    .select(columns)
                    .eq('organization_id', organizationId)
            },

            insert: (data: any) => {
                // 🔒 FORÇA organization_id em todos os inserts
                const dataWithOrg = Array.isArray(data)
                    ? data.map(item => ({ ...item, organization_id: organizationId }))
                    : { ...data, organization_id: organizationId }

                return (supabase as any).from(table).insert(dataWithOrg)
            },

            update: (data: any) => {
                // 🔒 Impede atualização de organization_id
                const { organization_id, ...safeData } = data

                return (supabase as any)
                    .from(table)
                    .update(safeData)
                    .eq('organization_id', organizationId)
            },

            delete: () => {
                return (supabase as any)
                    .from(table)
                    .delete()
                    .eq('organization_id', organizationId)
            },
        }
    }

    return { from }
}
