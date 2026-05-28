import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import {
    createEmptyGitHubRepositoryActivity,
    fetchGitHubRepositoryActivity,
} from '@/lib/admin/agent-command-center-github';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    try {
        const data = await fetchGitHubRepositoryActivity();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(createEmptyGitHubRepositoryActivity(), { status: 200 });
    }
}
