'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

// Plano data
const plans = [
  {
    id: 'starter',
    name: 'STARTER',
    weight: 20,
    kiwifyLink: 'https://pay.kiwify.com.br/nDh67eT',
    promo: '9,90',
    fixed: '19,90',
    capacity: 'Até 20 alunos',
  },
  {
    id: 'plus',
    name: 'PLUS',
    weight: 40,
    kiwifyLink: 'https://pay.kiwify.com.br/l0J7aBG',
    promo: '9,90',
    fixed: '29,90',
    capacity: 'Até 40 alunos',
  },
  {
    id: 'studio',
    name: 'STUDIO',
    weight: 100,
    kiwifyLink: 'https://pay.kiwify.com.br/6N4RjAj',
    promo: '29,90',
    fixed: '49,90',
    capacity: 'Até 100 alunos',
  },
  {
    id: 'pro',
    name: 'PRO',
    weight: 500,
    kiwifyLink: 'https://pay.kiwify.com.br/7snTI43',
    promo: '49,90',
    fixed: '79,90',
    capacity: 'Até 500 alunos',
  },
]

interface Plan {
  id: string;
  name: string;
  weight: number;
  kiwifyLink: string;
  promo: string;
  fixed: string;
  capacity: string;
}

export default function OnboardingStep2() {
  const router = useRouter()
  const { toast } = useToast()
  const { data, updateData } = useOnboarding()
  const supabase = createClient()

  const [establishmentName, setEstablishmentName] = useState('')
  const [studentRange, setStudentRange] = useState('') // stores selected weight as string

  // Ensure the user selected a business type in step‑1
  useEffect(() => {
    if (!data.businessType) {
      router.replace('/app/onboarding')
    }
  }, [data.businessType, router])

  const handleProceed = async (plan: Plan) => {
    if (!establishmentName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Nome do Estabelecimento é obrigatório.',
      })
      return
    }
    // Save establishment name and selected range in onboarding context
    // Save to onboarding context
    updateData({ organizationName: establishmentName, studentRange })

    // Persist to Supabase (profiles table assumed)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('profiles').upsert({
        user_id: user?.id,
        establishment_name: establishmentName,
        student_range: studentRange,
      } as any)
      if (error) throw error
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Erro inesperado',
      })
      return
    }

    // Redirect to external Kiwify checkout with email pre‑filled
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const email = currentUser?.email || ''
    const url = `${plan.kiwifyLink}?email=${encodeURIComponent(email)}`
    window.location.href = url
  }


    // Redirect to external Kiwify checkout with email pre‑filled
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const email = currentUser?.email || ''
    const url = `${plan.kiwifyLink}?email=${encodeURIComponent(email)}`
    window.location.href = url
  }

  // Filter plans based on selected range
  const filteredPlans = plans.filter((p) => !studentRange || p.weight >= Number(studentRange))

  return (
    <div className="flex min-h-[100dvh] bg-[#0B0F1A] p-4 md:p-8 items-center justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex justify-center">
          <BeeGymLogo variant="dark" size="lg" />
        </div>
        <OnboardingProgress currentStep={2} />
        {/* Section A – establishment name */}
        <div className="space-y-2">
          <Label htmlFor="establishment">Nome do Estabelecimento / Nome do Profissional</Label>
          <Input
            id="establishment"
            placeholder="Ex: Studio Fitness, João Personal..."
            value={establishmentName}
            onChange={(e) => setEstablishmentName(e.target.value)}
            required
          />
        </div>
        {/* Section B – student range select */}
        <div className="space-y-2">
          <Label htmlFor="studentRange">Quantos alunos ativos você possui ou pretende gerenciar?</Label>
          <Select onValueChange={setStudentRange}>
            <SelectTrigger id="studentRange" className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Até 20 alunos</SelectItem>
              <SelectItem value="40">De 21 a 40 alunos</SelectItem>
              <SelectItem value="100">De 41 a 100 alunos</SelectItem>
              <SelectItem value="500">De 101 a 500 alunos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-bee-amber">{plan.name}</CardTitle>
                <CardDescription>{plan.capacity}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold">Primeira mensalidade: R$ {plan.promo}</p>
                <p className="text-sm">Após, será cobrado o valor de R$ {plan.fixed} / mês.</p>
                <p className="text-xs text-gray-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1a7 7 0 00-7 7v4a3 3 0 003 3h1v-5H6v-2a4 4 0 018 0v2h-1v5h1a3 3 0 003-3V8a7 7 0 00-7-7z"/></svg>
                  Garantia incondicional de 7 dias para devolução do valor pago.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleProceed(plan)}
                >
                  Selecionar e Avançar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
