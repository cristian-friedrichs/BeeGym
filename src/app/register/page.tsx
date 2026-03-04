'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
    })

    const supabase = createClient()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        // Simple phone mask (99) 99999-9999
        if (name === 'phone') {
            let phone = value.replace(/\D/g, '')
            if (phone.length > 11) phone = phone.slice(0, 11)

            // Format: (99) 99999-9999
            phone = phone.replace(/^(\d{2})(\d)/g, '($1) $2')
            phone = phone.replace(/(\d)(\d{4})$/, '$1-$2')

            setFormData(prev => ({ ...prev, [name]: phone }))
            return
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Sign Up
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        // Provide default values for trigger if needed, or trigger handles it
                    },
                },
            })

            if (error) throw error

            if (data.session) {
                toast({
                    title: 'Conta criada com sucesso!',
                    description: 'Redirecionando para configuração...',
                })

                // Use window.location.assign for robust cookie propagation to middleware
                window.location.assign('/onboarding')
            } else {
                toast({
                    title: 'Conta criada!',
                    description: 'Por favor, verifique seu e-mail para ativar sua conta.',
                })

                router.push('/login')
            }

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro no registro',
                description: error.message || 'Ocorreu um erro ao criar sua conta.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl font-bold text-center">Crie sua conta</CardTitle>
                    <CardDescription className="text-center">
                        Insira seus dados abaixo para começar
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="grid gap-4">
                        <Button variant="outline" className="w-full" onClick={async () => {
                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${location.origin}/auth/callback?next=/onboarding`,
                                    queryParams: {
                                        access_type: 'offline',
                                        prompt: 'consent',
                                    },
                                },
                            })
                        }}>
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="mr-2 h-4 w-4"
                            />
                            Google
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Ou continue com
                                </span>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="fullName" className="text-xs">Nome Completo</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="João Silva"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="phone" className="text-xs">Telefone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="(11) 99999-9999"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-xs">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="joao@exemplo.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs">Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="h-9"
                                />
                            </div>
                            <Button className="w-full mt-2" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Conta
                            </Button>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Entrar
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
