import { SectionHeader } from '@/components/ui/section-header';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import { LeaderMeetingBoard } from '@/components/admin/agentes/leader-meeting-board';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { leaderMeetings } from '@/lib/admin/agent-command-center-data';

export default function AgentLeaderMeetingsPage() {
    const currentMeeting = leaderMeetings[0];

    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Reuniao de Lideres" subtitle="Thread visual para decisoes, bloqueios e proximos passos por departamento" />
            <MockDataNotice />
            <AgentCommandCenterNav />
            <LeaderMeetingBoard meeting={currentMeeting} />
        </div>
    );
}
