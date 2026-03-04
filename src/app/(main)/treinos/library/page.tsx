'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Plus, Search, Library } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { exercises as baseExercises, tagColors, Exercise } from '@/lib/exercises';


export default function WorkoutsLibraryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('base');
  const [searchTerm, setSearchTerm] = useState('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [userExercisesCount, setUserExercisesCount] = useState(0);

  useEffect(() => {
    try {
        const userExercises: Exercise[] = JSON.parse(localStorage.getItem('user_exercises') || '[]');
        setAllExercises([...baseExercises, ...userExercises]);
        setUserExercisesCount(userExercises.length);
    } catch(e) {
        console.error("Could not load user exercises from localStorage", e);
        setAllExercises(baseExercises);
    }
  }, []);

  const filteredExercises = allExercises.filter(exercise => 
    exercise.type === activeTab &&
    (exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     exercise.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">Gerencie seus exercícios e use a IA para gerar imagens</p>
        </div>
        <Button onClick={() => toast({ title: "Funcionalidade em desenvolvimento." })}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, tipo, tag..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todos os Músculos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abdomem">Abdômen</SelectItem>
            <SelectItem value="peito">Peito</SelectItem>
            <SelectItem value="costas">Costas</SelectItem>
            <SelectItem value="pernas">Pernas</SelectItem>
            <SelectItem value="ombros">Ombros</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todas as Categorias" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="musculacao">Musculação</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="funcional">Funcional</SelectItem>
          </SelectContent>
        </Select>
         <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todas as Dificuldades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex border-b">
          <button 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'user' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('user')}
          >
            <Dumbbell className="h-4 w-4" />
            Meus Exercícios ({userExercisesCount})
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'base' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('base')}
          >
            <Library className="h-4 w-4" />
            Base de Exercícios ({baseExercises.length})
          </button>
        </div>

        <div className="mt-4 space-y-2">
            {filteredExercises.length > 0 ? filteredExercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary rounded-lg">
                           {exercise.icon}
                        </div>
                        <div>
                            <p className="font-bold">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">{exercise.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end max-w-xs">
                        {exercise.tags.map((tag, tagIndex) => {
                            const colorClass = tagColors[tag] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                            return <Badge key={`${tag}-${tagIndex}`} variant="outline" className={`font-medium ${colorClass}`}>{tag}</Badge>
                        })}
                    </div>
                </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {activeTab === 'base' ? 'Nenhum exercício encontrado para sua busca.' : 'Você ainda não criou nenhum exercício.'}
                </p>
                {activeTab === 'user' && (
                   <Button onClick={() => toast({ title: "Funcionalidade em desenvolvimento." })} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
                  </Button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
