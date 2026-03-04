import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

type AuditAction =
    | 'USER_CREATED'
    | 'USER_DELETED'
    | 'STUDENT_CREATED'
    | 'STUDENT_DELETED'
    | 'PAYMENT_PROCESSED'
    | 'PLAN_CHANGED'
    | 'SETTINGS_UPDATED'
    | 'DATA_EXPORTED'

interface AuditLogParams {
    action: AuditAction
    resource: string
    details?: string
    metadata?: Record<string, any>
    organizationId: string
    userId: string
}

export async function createAuditLog({
    action,
    resource,
    details,
    metadata,
    organizationId,
    userId,
}: AuditLogParams) {
    try {
        const { error } = await (supabase as any)
            .from('system_logs')
            .insert({
                organization_id: organizationId,
                user_id: userId,
                action,
                resource,
                details,
                metadata: metadata || {},
            })

        if (error) {
            console.error('❌ Falha ao criar audit log:', error)
        }
    } catch (err) {
        console.error('❌ Erro ao criar audit log:', err)
    }
}

// 🔒 Hook para logging automático
export function useAuditLog() {
    const { organizationId, user } = useAuth()

    const log = async (
        action: AuditAction,
        resource: string,
        details?: string,
        metadata?: Record<string, any>
    ) => {
        if (!organizationId || !user?.id) {
            console.warn('⚠️ Tentativa de log sem contexto de autenticação')
            return
        }

        await createAuditLog({
            action,
            resource,
            details,
            metadata,
            organizationId,
            userId: user.id,
        })
    }

    return { log }
}
