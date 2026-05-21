'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfISOWeek, endOfISOWeek, isWithinInterval, parseISO } from 'date-fns';
import { StudentProfileMainSection } from '@/components/alunos/student-profile-main-section';
import { StudentStatusDialog } from '@/components/painel/dialogs/student-status-dialog';
import dynamic from 'next/dynamic';

const StudentModal = dynamic(() => import('@/components/alunos/student-modal').then(m => ({ default: m.StudentModal })), { ssr: false });
const QuickMessageModal = dynamic(() => import('@/components/alunos/quick-message-modal').then(m => ({ default: m.QuickMessageModal })), { ssr: false });
const CreateMeasurementModal = dynamic(() => import('@/components/alunos/create-measurement-modal').then(m => ({ default: m.CreateMeasurementModal })), { ssr: false });
const ManagePlanModal = dynamic(() => import('@/components/alunos/manage-plan-modal').then(m => ({ default: m.ManagePlanModal })), { ssr: false });
const WorkoutModal = dynamic(() => import('@/components/treinos/workout-modal').then(m => ({ default: m.WorkoutModal })), { ssr: false });
const RecurringWorkoutModal = dynamic(() => import('@/components/treinos/recurring-workout-modal').then(m => ({ default: m.RecurringWorkoutModal })), { ssr: false });

import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MedicalRecordModal } from "@/components/alunos/medical-record-modal";
import { MedicalRecordCard } from "@/components/alunos/medical-record-card";
import { MeasurementEvolutionChart } from "@/components/alunos/measurement-evolution-chart";
import { StudentActivitiesCard } from "@/components/alunos/student-activities-card";

export default function StudentDetailsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const params = useParams();
    const id = params.id as string;

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

    const fetchStudentData = async () => {
        if (!id) return;
        try {
            // Trigger status transitions for both classes and workouts asynchronously (non-blocking)
            supabase.rpc('update_class_statuses' as any).then(null, () => {});

            // 1. Fetch Student
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (studentError) throw studentError;

            const student = studentData as any;

            // 2. Fetch Plan (if exists)
            let planData = null;
            if (student.plan_id) {
                const { data: pData } = await supabase
                    .from('membership_plans')
                    .select('name, price, recurrence, days_per_week, plan_type, credits, duration_months')
                    .eq('id', student.plan_id)
                    .single();
                if (pData) {
                    planData = pData;
                }
            }

            // 2.1 Fetch Unit (if exists)
            let unitData = null;
            if (student.unit_id) {
                const { data: uData } = await supabase
                    .from('units')
                    .select('name')
                    .eq('id', student.unit_id)
                    .single();
                if (uData) unitData = (uData as any).name;
            }

            // 3. Fetch Measurements
            const { data: measurementsData } = await supabase
                .from('student_measurements' as any)
                .select('recorded_at, weight, height, body_fat, bmi') // BMI is now available
                .eq('student_id', id)
                .order('recorded_at', { ascending: false });

            // 4. Fetch Workouts
            const { data: workoutsData } = await supabase
                .from('workouts' as any)
                .select('id, title, type, created_at, status, scheduled_at, description, is_makeup')
                .eq('student_id', id)
                .order('created_at', { ascending: false });

            // 5. Fetch Invoices/Payments (pack + recurring)
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('id, amount, status, due_date, paid_at, description')
                .eq('student_id', id)
                .order('due_date', { ascending: false });

            // 6. Fetch Medical Record
            const { data: medicalData } = await (supabase.from('student_medical_records' as any) as any)
                .select('*')
                .eq('student_id', id)
                .maybeSingle();

            // 7. Fetch QUEUED plan (if any) — pack -> recurring switch with active credits
            const { data: queuedData } = await (supabase.from('student_plan_history' as any) as any)
                .select('id, plan_id, plan_name, plan_price, final_price, requested_activation_at')
                .eq('student_id', id)
                .eq('status', 'QUEUED')
                .maybeSingle();

            setStudent({
                ...student,
                plan: planData,
                queuedPlan: queuedData,
                unitName: unitData,
                measurements: measurementsData || [],
                workouts: workoutsData || [],
                invoices: invoicesData || [],
                medicalRecord: medicalData
            });

        } catch (error) {
            console.error('Error fetching student details:', error);
            toast({ title: "Erro ao carregar detalhes", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => {
        const { error } = await (supabase.from('students') as any)
            .update({ 
                status: newStatus,
                inactive_reason: newStatus === 'INACTIVE' ? reason : null
            })
            .eq('id', student.id);

        if (error) {
            throw error;
        } else {
            fetchStudentData();
        }
    };

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
    );

    if (!student) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-xl font-semibold">Aluno não encontrado</h1>
            <Link href="/app/alunos" className="text-orange-500 hover:underline flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar para lista
            </Link>
        </div>
    );

    // Attendance stats
    const pastWorkouts = (student.workouts || []).filter((w: any) => w.status === 'Concluido' || w.status === 'Faltou');
    const completedWorkouts = pastWorkouts.filter((w: any) => w.status === 'Concluido');
    const attendancePercentage = pastWorkouts.length > 0
        ? Math.round((completedWorkouts.length / pastWorkouts.length) * 100)
        : 0;
    const completedCount = completedWorkouts.length;
    const currentWeight = student.measurements[0]?.weight;
    const currentHeight = student.measurements[0]?.height;


    return (
        <div className="space-y-5 pb-8">
            {/* Back nav */}
            <Link href="/app/alunos" className="w-fit">
                <Button variant="ghost" size="sm" className="gap-1.5 text-slate-400 hover:text-slate-700 hover:bg-transparent p-0 h-auto font-medium text-sm group">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Voltar para Alunos
                </Button>
            </Link>

            {/* Main profile card */}
            <StudentProfileMainSection
                student={student}
                attendancePercentage={attendancePercentage}
                completedCount={completedCount}
                currentWeight={currentWeight}
                currentHeight={currentHeight}
                onEdit={() => setIsEditModalOpen(true)}
                onMessage={() => setIsMessageModalOpen(true)}
                onWorkout={() => setIsRecurringModalOpen(true)}
                onMeasurement={() => setIsMeasurementModalOpen(true)}
                onPlan={() => setIsPlanModalOpen(true)}
                onInactivate={() => setIsStatusDialogOpen(true)}
            />

            {/* Queued plan banner */}
            {student.queuedPlan && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-bee-amber/15 flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 text-bee-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                            Plano mensal em fila: {student.queuedPlan.plan_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Será ativado automaticamente quando o aluno usar todos os créditos restantes. A partir daí a fatura passa a ser gerada conforme a configuração da organização (X dias antes do vencimento).
                        </p>
                    </div>
                </div>
            )}

            {/* Chart + Medical side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 h-[320px]">
                    <MeasurementEvolutionChart data={student.measurements} studentId={id} />
                </div>
                <div className="lg:col-span-2 h-[320px]">
                    <MedicalRecordCard data={student.medicalRecord} onEdit={() => setIsMedicalModalOpen(true)} />
                </div>
            </div>

            {/* Unified activities card */}
            <StudentActivitiesCard
                studentId={id}
                workouts={(student.workouts || []).filter((w: any) =>
                    ['Concluido', 'Faltou', 'Cancelado', 'Realizada', 'Agendado', 'Em Execução'].includes(w.status)
                )}
                invoices={student.invoices}
                onWorkoutClick={() => setIsWorkoutModalOpen(true)}
            />

            {/* Modals */}
            <StudentModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                studentToEdit={student}
                onSuccess={fetchStudentData}
            />
            <CreateMeasurementModal
                open={isMeasurementModalOpen}
                onOpenChange={setIsMeasurementModalOpen}
                studentId={student.id}
                onSuccess={fetchStudentData}
            />
            <ManagePlanModal
                open={isPlanModalOpen}
                onOpenChange={setIsPlanModalOpen}
                studentId={student.id}
                onSuccess={fetchStudentData}
            />
            <MedicalRecordModal
                open={isMedicalModalOpen}
                onOpenChange={setIsMedicalModalOpen}
                studentId={id}
                existingData={student.medicalRecord}
                onSuccess={fetchStudentData}
            />
            <WorkoutModal
                open={isWorkoutModalOpen}
                onOpenChange={setIsWorkoutModalOpen}
                defaultStudentId={id}
                onSuccess={fetchStudentData}
            />
            <RecurringWorkoutModal
                open={isRecurringModalOpen}
                onOpenChange={setIsRecurringModalOpen}
                studentId={id}
                studentName={student?.full_name || ""}
                organizationId={student?.organization_id || ""}
                onSuccess={fetchStudentData}
            />
            <QuickMessageModal
                open={isMessageModalOpen}
                onOpenChange={setIsMessageModalOpen}
                studentId={student.id}
                studentName={student.full_name}
                studentEmail={student.email}
            />
            {student && (
                <StudentStatusDialog
                    open={isStatusDialogOpen}
                    onOpenChange={setIsStatusDialogOpen}
                    studentId={student.id}
                    studentName={student.full_name}
                    currentStatus={student.status}
                    onStatusChange={handleStatusChange}
                    triggerButton={<span />}
                />
            )}
        </div>
    );
}
