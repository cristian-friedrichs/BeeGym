import { notFound } from 'next/navigation';
import { AgentDetailPanel } from '@/components/admin/agentes/agent-detail-panel';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { getAgent } from '@/lib/admin/agent-command-center-data';

interface Props {
    params: Promise<{ agentId: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
    const { agentId } = await params;
    const agent = getAgent(agentId);

    if (!agent) {
        notFound();
    }

    return (
        <>
            <MockDataNotice />
            <AgentDetailPanel agent={agent} />
        </>
    );
}
