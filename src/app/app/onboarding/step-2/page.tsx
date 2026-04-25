'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowRight } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

export default function OnboardingStep2() {
    const router = useRouter()
    const { toast } = useToast()
    const { data, updateData, isHydrated } = useOnboarding()

    const [isCepLoading, setIsCepLoading] = useState(false)
    const [cities, setCities] = useState<string[]>([])
    const [isCitiesLoading, setIsCitiesLoading] = useState(false)

    const [formData, setFormData] = useState({
        organizationName: '',
        documentType: 'CNPJ' as 'CPF' | 'CNPJ',
        document: '',
        phone: '',
        email: '',
        studentRange: '',
        hasPhysicalLocation: true,
        addressZip: '',
        addressLine1: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
    })

    // Sincronizar com o contexto apenas uma vez após a hidratação
    useEffect(() => {
        if (isHydrated) {
            setFormData(prev => ({
                ...prev,
                organizationName: data.organizationName || prev.organizationName,
                documentType: data.documentType || prev.documentType,
                document: data.document || prev.document,
                phone: data.phone || prev.phone,
                email: data.email || prev.email,
                studentRange: data.studentRange || prev.studentRange,
                hasPhysicalLocation: data.businessType === 'Personal' ? false : (data.hasPhysicalLocation ?? prev.hasPhysicalLocation),
                addressZip: data.addressZip || prev.addressZip,
                addressLine1: data.addressLine1 || prev.addressLine1,
                addressNumber: data.addressNumber || prev.addressNumber,
                addressComplement: data.addressComplement || prev.addressComplement,
                addressNeighborhood: data.addressNeighborhood || prev.addressNeighborhood,
                addressCity: data.addressCity || prev.addressCity,
                addressState: data.addressState || prev.addressState,
            }))
        }
    }, [isHydrated]) // Removido 'data' para não resetar enquanto o usuário digita

    // Load cities for mobile/no physical location
    useEffect(() => {
        if (!formData.addressState || formData.hasPhysicalLocation) {
            setCities([])
            return
        }
        const fetchCities = async () => {
            setIsCitiesLoading(true)
            try {
                const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.addressState}/municipios`)
                const ufData = await response.json()
                if (Array.isArray(ufData)) {
                    setCities(ufData.map((c: any) => c.nome))
                }
            } catch (error) {
                console.error('Erro ao buscar cidades', error)
            } finally {
                setIsCitiesLoading(false)
            }
        }
        fetchCities()
    }, [formData.addressState, formData.hasPhysicalLocation])

    // Redirect if no business type selected
    useEffect(() => {
        if (isHydrated && (!data.businessType)) {
            router.replace('/app/onboarding')
        }
    }, [data.businessType, isHydrated, router])

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const formatCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    const formatCep = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
    }

    const handleCepBlur = async () => {
        const cep = formData.addressZip.replace(/\D/g, '')
        if (cep.length !== 8) return

        setIsCepLoading(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    addressLine1: data.logradouro,
                    addressNeighborhood: data.bairro,
                    addressCity: data.localidade,
                    addressState: data.uf
                }))
                document.getElementById('addressNumber')?.focus()
            }
        } catch (error) {
            console.error('Erro ao buscar CEP', error)
        } finally {
            setIsCepLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        let formattedValue = value

        if (name === 'document') {
            formattedValue = formData.documentType === 'CPF' ? formatCPF(value) : formatCNPJ(value)
        } else if (name === 'phone') {
            formattedValue = formatPhone(value)
        } else if (name === 'addressZip') {
            formattedValue = formatCep(value)
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))

        // Reset document when type changes
        if (name === 'documentType') {
            setFormData(prev => ({ ...prev, document: '' }))
        }
    }

    const validateForm = () => {
        const requiredFields = [
            { key: 'organizationName', label: 'Nome do Estabelecimento' },
            { key: 'document', label: 'CPF/CNPJ' },
            { key: 'phone', label: 'Telefone' },
            { key: 'email', label: 'E-mail Comercial' },
            { key: 'studentRange', label: 'Número de Alunos' }
        ]

        for (const field of requiredFields) {
            const value = formData[field.key as keyof typeof formData]
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Campo obrigatório', 
                    description: `O campo ${field.label} é obrigatório.` 
                })
                return false
            }
        }

        if (formData.hasPhysicalLocation) {
            if (!formData.addressZip || formData.addressZip.length < 8) {
                toast({ variant: 'destructive', title: 'Endereço incompleto', description: 'O CEP é obrigatório para localização física.' })
                return false
            }
            if (!formData.addressNumber) {
                toast({ variant: 'destructive', title: 'Endereço incompleto', description: 'O número do endereço é obrigatório.' })
                return false
            }
            if (!formData.addressCity || !formData.addressState) {
                toast({ variant: 'destructive', title: 'Endereço incompleto', description: 'Cidade e UF são obrigatórios.' })
                return false
            }
        } else {
            if (!formData.addressState || !formData.addressCity) {
                toast({ variant: 'destructive', title: 'Local de atuação', description: 'Informe sua cidade principal e estado (UF).' })
                return false
            }
        }

        return true
    }

    const handleNext = () => {
        if (!validateForm()) return
        updateData(formData)
        router.push('/app/onboarding/step-3')
    }

    return (
        <div className="flex min-h-[100dvh] bg-[#0B0F1A] p-2 md:p-4">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-4 flex flex-col justify-center pb-32">
                <div className="flex justify-center mb-2">
                    <BeeGymLogo variant="dark" size="lg" />
                </div>
                <OnboardingProgress currentStep={2} />

                <div className="border border-white/10 bg-white/[0.02] overflow-hidden border-t-2 border-t-bee-amber">
                    <div className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Coluna 1: Identificação e Contato */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-6 bg-bee-amber" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white font-display">Identificação do Espaço</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Nome do Estabelecimento *</Label>
                                        <Input
                                            id="organizationName"
                                            name="organizationName"
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                            placeholder="Ex: BeeGym Studio"
                                            className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Tipo *</Label>
                                            <Select value={formData.documentType} onValueChange={(v) => handleSelectChange('documentType', v)}>
                                                <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CPF">CPF</SelectItem>
                                                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">{formData.documentType} *</Label>
                                            <Input
                                                id="document"
                                                name="document"
                                                value={formData.document}
                                                onChange={handleChange}
                                                placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
                                                maxLength={formData.documentType === 'CPF' ? 14 : 18}
                                                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Telefone *</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">E-mail Comercial *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="contato@exemplo.com"
                                                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Número de Alunos *</Label>
                                        <Select value={formData.studentRange} onValueChange={(v) => handleSelectChange('studentRange', v)}>
                                            <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-20">1 a 20</SelectItem>
                                                <SelectItem value="21-40">21 a 40</SelectItem>
                                                <SelectItem value="41-100">41 a 100</SelectItem>
                                                <SelectItem value="101-400">101 a 400</SelectItem>
                                                <SelectItem value="400+">Acima de 400</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Coluna 2: Localização */}
                            <div className="p-6 bg-white/[0.02] border-l border-white/10 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-6 bg-bee-amber" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white font-display">Localização</h3>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10">
                                        <Switch
                                            id="physical-location"
                                            checked={!formData.hasPhysicalLocation}
                                            onCheckedChange={(checked) => setFormData(prev => ({
                                                ...prev,
                                                hasPhysicalLocation: !checked,
                                                addressZip: checked ? '' : prev.addressZip,
                                                addressLine1: checked ? '' : prev.addressLine1,
                                                addressNumber: checked ? '' : prev.addressNumber,
                                                addressComplement: checked ? '' : prev.addressComplement,
                                                addressNeighborhood: checked ? '' : prev.addressNeighborhood,
                                                addressCity: prev.addressCity,
                                                addressState: prev.addressState,
                                            }))}
                                        />
                                        <Label htmlFor="physical-location" className="text-xs text-slate-400 font-medium cursor-pointer">Atendimento 100% Online / Domiciliar</Label>
                                    </div>

                                    {formData.hasPhysicalLocation ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 ml-1">CEP *</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="addressZip"
                                                        name="addressZip"
                                                        value={formData.addressZip}
                                                        onChange={handleChange}
                                                        onBlur={handleCepBlur}
                                                        placeholder="00000-000"
                                                        maxLength={9}
                                                        className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 transition-all focus:ring-bee-amber/20"
                                                    />
                                                    {isCepLoading && (
                                                        <div className="absolute right-3 top-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-bee-amber" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <div className="sm:col-span-3 space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">Endereço</Label>
                                                    <Input 
                                                        id="addressLine1"
                                                        name="addressLine1" 
                                                        value={formData.addressLine1} 
                                                        onChange={handleChange}
                                                        className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all" 
                                                        placeholder="Rua, Avenida..." 
                                                    />
                                                </div>
                                                <div className="sm:col-span-1 space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">Nº *</Label>
                                                    <Input 
                                                        id="addressNumber"
                                                        name="addressNumber" 
                                                        value={formData.addressNumber} 
                                                        onChange={handleChange} 
                                                        className="h-12 border-white/10 bg-white/5 text-white" 
                                                        placeholder="00" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">Bairro</Label>
                                                    <Input 
                                                        id="addressNeighborhood"
                                                        name="addressNeighborhood" 
                                                        value={formData.addressNeighborhood} 
                                                        onChange={handleChange}
                                                        className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all" 
                                                        placeholder="Bairro"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">Complemento</Label>
                                                    <Input name="addressComplement" value={formData.addressComplement} onChange={handleChange} className="h-12 border-white/10 bg-white/5 text-white" placeholder="Sala, Apto..." />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">Cidade</Label>
                                                    <Input 
                                                        id="addressCity"
                                                        name="addressCity" 
                                                        value={formData.addressCity} 
                                                        onChange={handleChange}
                                                        className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all" 
                                                        placeholder="Cidade"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-400 ml-1">UF</Label>
                                                    <Input 
                                                        id="addressState"
                                                        name="addressState" 
                                                        value={formData.addressState} 
                                                        onChange={handleChange}
                                                        className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 transition-all uppercase" 
                                                        placeholder="UF"
                                                        maxLength={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 ml-1">Estado (UF) *</Label>
                                                <Select value={formData.addressState} onValueChange={(v) => setFormData(prev => ({ ...prev, addressState: v, addressCity: '' }))}>
                                                    <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 ml-1">Cidade Principal de Atuação *</Label>
                                                <div className="relative">
                                                    <Input
                                                        name="addressCity"
                                                        value={formData.addressCity}
                                                        onChange={handleChange}
                                                        placeholder="Ex: São Paulo"
                                                        list="cities-list"
                                                        disabled={!formData.addressState || isCitiesLoading}
                                                        className="h-12 border-white/10 bg-white/5 text-white"
                                                    />
                                                    {isCitiesLoading && <Loader2 className="absolute right-3 top-4 h-4 w-4 animate-spin text-orange-500" />}
                                                </div>
                                                <datalist id="cities-list">
                                                    {cities.map(city => <option key={city} value={city} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-white/10 p-6 bg-white/[0.02]">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/app/onboarding')}
                            className="text-slate-500 hover:text-bee-amber hover:bg-white/5 px-8 h-12 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="h-14 px-12 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black rounded-full shadow-xl shadow-bee-amber/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-display text-sm uppercase tracking-wider"
                        >
                            Próximo Passo <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>

                    {/* Botão Sair */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={async () => {
                                const { createClient } = await import('@/lib/supabase/client')
                                const supabase = createClient()
                                await supabase.auth.signOut()
                                router.push('/login')
                                router.refresh()
                            }}
                            className="text-[10px] text-slate-600 hover:text-bee-amber transition-colors font-bold uppercase tracking-widest"
                        >
                            Sair e voltar ao Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
