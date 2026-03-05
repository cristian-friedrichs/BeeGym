'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Edit, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalRecordCardProps {
    data?: any;
    onEdit: () => void;
}

export function MedicalRecordCard({ data, onEdit }: MedicalRecordCardProps) {
    const hasData = data && (data.characteristics || data.disabilities || data.difficulties || data.other_notes);

    return (
        <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white h-full flex flex-col">
            <CardHeader className="py-3 px-5 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Ficha do Aluno</CardTitle>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-amber-50 transition-colors"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-hidden">
                {hasData ? (
                    <div className="space-y-2">
                        {data.characteristics && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Características</h4>
                                <p className="text-sm text-slate-600 leading-tight font-medium">{data.characteristics}</p>
                            </div>
                        )}
                        {data.disabilities && (
                            <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <AlertCircle className="h-3 w-3 text-red-600" />
                                    <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Restrições / Patologias</h4>
                                </div>
                                <p className="text-sm text-red-700 leading-tight font-medium">{data.disabilities}</p>
                            </div>
                        )}
                        {data.difficulties && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lesões / Dificuldades</h4>
                                <p className="text-sm text-slate-600 leading-tight font-medium">{data.difficulties}</p>
                            </div>
                        )}
                        {data.other_notes && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações</h4>
                                <p className="text-sm text-slate-600 leading-tight italic">{data.other_notes}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <ClipboardList className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium tracking-tight">Nenhuma informação médica registrada.</p>
                        <Button variant="outline" size="sm" onClick={onEdit} className="mt-4 border-dashed border-slate-300 text-slate-500 hover:text-orange-600 hover:bg-amber-50 transition-colors rounded-xl font-bold uppercase tracking-widest text-[10px] h-8 px-4">
                            Clique para preencher
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
