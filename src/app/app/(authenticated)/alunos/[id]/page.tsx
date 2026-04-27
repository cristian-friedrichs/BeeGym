'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfISOWeek, endOfISOWeek, isWithinInterval, parseISO } from 'date-fns';
import { StudentProfileMainSection } from '@/components/alunos/student-profile-main-section';
import { ActiveListSection } from '@/components/alunos/active-list-section';
import { StudentModal } from '@/components/alunos/student-modal';
import { QuickMessageModal } from "@/components/alunos/quick-message-modal";
import { CreateMeasurementModal } from "@/components/alunos/create-measurement-modal";
import { ManagePlanModal } from "@/components/alunos/manage-plan-modal";
import { WorkoutModal } from "@/components/treinos/workout-modal";
import { RecurringWorkoutModal } from "@/components/treinos/recurring-workout-modal";

import { ArrowLeft, Loader2, TrendingUp, Dumbbell, RefreshCw, ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// New Components
import { MedicalRecordModal } from "@/components/alunos/medical-record-modal";
import { MedicalRecordCard } from "@/components/alunos/medical-record-card";
import { MeasurementEvolutionChart } from "@/components/alunos/measurement-evolution-chart";

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

    const fetchStudentData = async () => {
        if (!id) return;
        try {
            // Trigger status transitions for both classes and workouts
            await supabase.rpc('update_class_statuses' as any);

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

            // 5. Fetch Invoices
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('*')
                .eq('student_id', id)
                .order('due_date', { ascending: false });

            // 6. Fetch Medical Record
            const { data: medicalData } = await (supabase.from('student_medical_records' as any) as any)
                .select('*')
                .eq('student_id', id)
                .maybeSingle();

            setStudent({
                ...student,
                plan: planData,
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

    const handleInactivate = async () => {
        if (!confirm("Tem certeza que deseja INATIVAR este aluno?\nEle perderá acesso ao aplicativo imediatamente.")) return;

        const { error } = await (supabase.from('students') as any)
            .update({ status: 'INACTIVE' })
            .eq('id', student.id);

        if (error) {
            toast({ title: "Erro ao inativar", variant: "destructive" });
        } else {
            toast({ title: "Aluno inativado com sucesso" });
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
        <div className="space-y-6">
            {/* Nav & Header */}
            <div className="flex flex-col gap-4 shrink-0">
                <Link href="/app/alunos" className="w-fit">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-orange-600 hover:bg-transparent transition-all font-bold uppercase tracking-widest text-[11px] h-auto p-0 group">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar para Alunos
                    </Button>
                </Link>

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
                    onInactivate={handleInactivate}
                />
            </div>

            {/* Main Dashboard Area: Metric Evolution & Medical Records */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[350px]">
                    <MeasurementEvolutionChart
                        data={student.measurements}
                        studentId={id}
                    />
                </div>
                <div className="h-[350px]">
                    <MedicalRecordCard
                        data={student.medicalRecord}
                        onEdit={() => setIsMedicalModalOpen(true)}
                    />
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 min-h-[400px]">
                <ActiveListSection
                    workouts={(student.workouts || []).filter((w: any) =>
                        ['Concluido', 'Faltou', 'Cancelado', 'Realizada', 'Agendado', 'Em Execução'].includes(w.status)
                    )}
                    invoices={student.invoices}
                    studentId={id}
                    onWorkoutClick={(id) => setIsWorkoutModalOpen(true)}
                    onInvoiceClick={() => { }}
                />
            </div>

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
        </div>
    );
}
