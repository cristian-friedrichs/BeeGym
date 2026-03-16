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

    // Sincronizar com o contexto após a hidratação
    useEffect(() => {
        if (isHydrated) {
            setFormData({
                organizationName: data.organizationName || '',
                documentType: data.documentType || 'CNPJ',
                document: data.document || '',
                phone: data.phone || '',
                email: data.email || '',
                studentRange: data.studentRange || '',
                hasPhysicalLocation: data.businessType === 'Personal' ? false : (data.hasPhysicalLocation ?? true),
                addressZip: data.addressZip || '',
                addressLine1: data.addressLine1 || '',
                addressNumber: data.addressNumber || '',
                addressComplement: data.addressComplement || '',
                addressNeighborhood: data.addressNeighborhood || '',
                addressCity: data.addressCity || '',
                addressState: data.addressState || '',
            })
        }
    }, [isHydrated, data])

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
        if (!formData.organizationName || !formData.document || !formData.phone || !formData.email || !formData.studentRange) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos obrigatórios.' })
            return false
        }

        if (formData.hasPhysicalLocation && !formData.addressZip) {
            toast({ variant: 'destructive', title: 'Endereço obrigatório', description: 'Informe o CEP do estabelecimento.' })
            return false
        }

        if (!formData.hasPhysicalLocation && (!formData.addressCity || !formData.addressState)) {
            toast({ variant: 'destructive', title: 'Local de atuação', description: 'Informe sua cidade principal e estado (UF).' })
            return false
        }

        return true
    }

    const handleNext = () => {
        if (!validateForm()) return

        updateData(formData)
        router.push('/app/onboarding/step-3')
    }

    return (
        <div className="flex min-h-[100dvh] bg-white p-2 md:p-4">
            <div className="max-w-6xl mx-auto w-full my-auto space-y-4 flex flex-col justify-center pb-32">
                <OnboardingProgress currentStep={2} />

                <Card className="border-slate-100 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden rounded-[2.5rem] border-t-4 border-t-bee-amber">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Coluna 1: Identificação e Contato */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-bee-midnight font-display">Identificação do Espaço</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 ml-1">Nome do Estabelecimento *</Label>
                                        <Input
                                            name="organizationName"
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                            placeholder="Ex: BeeGym Studio"
                                            className="h-12 rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 ml-1">Tipo *</Label>
                                            <Select value={formData.documentType} onValueChange={(v) => handleSelectChange('documentType', v)}>
                                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CPF">CPF</SelectItem>
                                                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 ml-1">{formData.documentType} *</Label>
                                            <Input
                                                name="document"
                                                value={formData.document}
                                                onChange={handleChange}
                                                placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
                                                maxLength={formData.documentType === 'CPF' ? 14 : 18}
                                                className="h-12 rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 ml-1">Telefone *</Label>
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                                className="h-12 rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 ml-1">E-mail Comercial *</Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="contato@exemplo.com"
                                                className="h-12 rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 ml-1">Número de Alunos *</Label>
                                        <Select value={formData.studentRange} onValueChange={(v) => handleSelectChange('studentRange', v)}>
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50">
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
                            <div className="p-6 bg-slate-50/50 border-l border-slate-100 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-bee-midnight font-display">Localização</h3>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
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
                                        <Label htmlFor="physical-location" className="text-xs text-slate-500 font-medium cursor-pointer">Atendimento 100% Online / Domiciliar</Label>
                                    </div>

                                    {formData.hasPhysicalLocation ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 ml-1">CEP *</Label>
                                                <div className="relative">
                                                    <Input
                                                        name="addressZip"
                                                        value={formData.addressZip}
                                                        onChange={handleChange}
                                                        onBlur={handleCepBlur}
                                                        placeholder="00000-000"
                                                        maxLength={9}
                                                        className="h-12 rounded-2xl border-slate-200 transition-all focus:ring-orange-500/20"
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
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">Endereço</Label>
                                                    <Input name="addressLine1" value={formData.addressLine1} readOnly className="h-12 rounded-2xl bg-slate-100/50 text-slate-500 border-none italic" placeholder="Preenchido via CEP" />
                                                </div>
                                                <div className="sm:col-span-1 space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">Nº *</Label>
                                                    <Input name="addressNumber" value={formData.addressNumber} onChange={handleChange} className="h-12 rounded-2xl border-slate-200" placeholder="00" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">Bairro</Label>
                                                    <Input name="addressNeighborhood" value={formData.addressNeighborhood} readOnly className="h-12 rounded-2xl bg-slate-100/50 text-slate-500 border-none italic" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">Complemento</Label>
                                                    <Input name="addressComplement" value={formData.addressComplement} onChange={handleChange} className="h-12 rounded-2xl border-slate-200" placeholder="Sala, Apto..." />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">Cidade</Label>
                                                    <Input name="addressCity" value={formData.addressCity} readOnly className="h-12 rounded-2xl bg-slate-100/50 text-slate-500 border-none italic" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 ml-1">UF</Label>
                                                    <Input name="addressState" value={formData.addressState} readOnly className="h-12 rounded-2xl bg-slate-100/50 text-slate-500 border-none italic uppercase" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 ml-1">Estado (UF) *</Label>
                                                <Select value={formData.addressState} onValueChange={(v) => setFormData(prev => ({ ...prev, addressState: v, addressCity: '' }))}>
                                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200">
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
                                                <Label className="text-xs font-bold text-slate-500 ml-1">Cidade Principal de Atuação *</Label>
                                                <div className="relative">
                                                    <Input
                                                        name="addressCity"
                                                        value={formData.addressCity}
                                                        onChange={handleChange}
                                                        placeholder="Ex: São Paulo"
                                                        list="cities-list"
                                                        disabled={!formData.addressState || isCitiesLoading}
                                                        className="h-12 rounded-2xl border-slate-200"
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
                    </CardContent>

                    <CardFooter className="flex justify-between border-t p-6 bg-white">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/app/onboarding')}
                            className="rounded-2xl text-slate-400 hover:text-bee-midnight hover:bg-slate-50 px-8 h-12 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={!formData.organizationName || !formData.document || !formData.phone || !formData.email || !formData.studentRange || (formData.hasPhysicalLocation && (!formData.addressZip || !formData.addressNumber)) || (!formData.hasPhysicalLocation && (!formData.addressState || !formData.addressCity))}
                            className="h-14 px-12 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black rounded-2xl shadow-xl shadow-bee-amber/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-display text-sm uppercase tracking-wider"
                        >
                            Próximo Passo <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
