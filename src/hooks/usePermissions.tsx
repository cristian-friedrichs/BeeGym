import { useAuth } from '@/lib/auth/AuthContext'
import { useMemo } from 'react'

export type Permission =
    | 'students:read'
    | 'students:write'
    | 'students:delete'
    | 'financial:read'
    | 'financial:write'
    | 'users:read'
    | 'users:write'
    | 'users:delete'
    | 'settings:write'
    | 'reports:read'

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: [
        'students:read',
        'students:write',
        'students:delete',
        'financial:read',
        'financial:write',
        'users:read',
        'users:write',
        'users:delete',
        'settings:write',
        'reports:read',
    ],
    INSTRUCTOR: [
        'students:read',
        'students:write',
        'reports:read',
    ],
    MANAGER: [
        'students:read',
        'students:write',
        'financial:read',
        'reports:read',
    ],
    STUDENT: [],
}

export function usePermissions() {
    const { profile } = useAuth()

    const permissions = useMemo(() => {
        if (!profile?.role) return []
        return ROLE_PERMISSIONS[profile.role] || []
    }, [profile?.role])

    const can = (permission: Permission): boolean => {
        return permissions.includes(permission)
    }

    const canAny = (perms: Permission[]): boolean => {
        return perms.some(p => permissions.includes(p))
    }

    const canAll = (perms: Permission[]): boolean => {
        return perms.every(p => permissions.includes(p))
    }

    return {
        can,
        canAny,
        canAll,
        permissions,
    }
}

// 🔒 Componente de proteção de UI
export function ProtectedComponent({
    permission,
    children,
    fallback = null
}: {
    permission: Permission
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    const { can } = usePermissions()

    if (!can(permission)) {
        return <>{ fallback } </>
    }

    return <>{ children } </>
}
