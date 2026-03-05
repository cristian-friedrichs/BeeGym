'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BeeGymLogo } from '@/components/ui/beegym-logo'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <RegisterForm />
        </Suspense>
    )
}

function RegisterForm() {
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    const formatPhone = (v: string) => {
        let phone = v.replace(/\D/g, '')
        if (phone.length > 11) phone = phone.slice(0, 11)
        phone = phone.replace(/^(\d{2})(\d)/g, '($1) $2')
        phone = phone.replace(/(\d)(\d{4})$/, '$1-$2')
        return phone
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            })

            if (signUpError) throw signUpError

            if (data.session) {
                toast({
                    title: 'Conta criada com sucesso!',
                    description: 'Redirecionando para configuração...',
                })
                window.location.assign('/app/onboarding')
            } else {
                toast({
                    title: 'Conta criada!',
                    description: 'Por favor, verifique seu e-mail para ativar sua conta.',
                })
                router.push('/app/login')
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao criar sua conta.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback?next=/app/onboarding`,
                queryParams: { access_type: 'offline', prompt: 'consent' },
            },
        })
    }

    return (
        <>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .auth-root {
          font-family: 'Inter', sans-serif;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);  }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.06; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.12; transform: scale(1.04) rotate(3deg); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }

        .panel-left  { animation: fadeIn 0.6s ease forwards; }
        .form-card   { animation: slideUp 0.6s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .form-field  { animation: slideUp 0.5s cubic-bezier(.22,1,.36,1) both; }
        .field-1  { animation-delay: 0.1s; }
        .field-2  { animation-delay: 0.18s; }
        .field-3  { animation-delay: 0.26s; }
        .field-4  { animation-delay: 0.34s; }
        .field-5  { animation-delay: 0.42s; }
        .field-6  { animation-delay: 0.5s; }

        .hex-bg { animation: hexPulse 8s ease-in-out infinite; }
        .hex-bg-2 { animation: hexPulse 10s ease-in-out infinite reverse; animation-delay: -3s; }

        .btn-primary:not(:disabled):hover { transform: translateY(-1px); }
        .btn-primary:not(:disabled):active { transform: translateY(0); }
        .btn-primary { transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease; }

        .input-field {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
        }
        .input-field:focus {
          outline: none;
          border-color: #FFBF00;
          box-shadow: 0 0 0 3px rgba(255, 191, 0,0.12);
          background: #fffdfa;
        }
        .input-field::placeholder { color: #94a3b8; }

        .google-btn {
          transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }
        .google-btn:hover { transform: translateY(-1px); background: #f8fafc !important; }
        .google-btn:active { transform: translateY(0); }

        .spinner { animation: spinLoader 0.8s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

            <div
                className="auth-root"
                style={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    overflow: 'hidden',
                    background: '#ffffff',
                }}
            >
                {/* ── LEFT PANEL ─────────────────────────────────────── */}
                <div
                    className="panel-left"
                    style={{
                        display: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(160deg, #0B0F1A 0%, #07090F 60%, #030712 100%)',
                    }}
                    aria-hidden="true"
                    id="auth-left-panel"
                >
                    <HexGrid />

                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #FFBF00, #E67E22, transparent)',
                    }} />

                    <div style={{
                        position: 'relative', zIndex: 10,
                        padding: '48px',
                        display: 'flex', flexDirection: 'column', height: '100%',
                    }}>
                        <div>
                            <BeeGymLogo variant="white" size="lg" />
                        </div>

                        <div style={{ marginTop: 'auto', paddingBottom: '64px' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255, 191, 0,0.12)',
                                border: '1px solid rgba(255, 191, 0,0.25)',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                marginBottom: '24px',
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFBF00', display: 'block' }} />
                                <span style={{ color: '#FFBF00', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Plataforma de Gestão
                                </span>
                            </div>

                            <h1 className="font-display" style={{
                                color: '#fff',
                                fontSize: 'clamp(36px, 4vw, 56px)',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em',
                                marginBottom: '20px',
                            }}>
                                Comece sua jornada<br />
                                <span className="text-bee-amber">conosco hoje.</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.6, maxWidth: '380px' }}>
                                Crie sua conta em segundos e transforme a gestão da sua academia.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL (form - LIGHT THEME) ─────────────────────────────── */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 24px',
                    position: 'relative',
                    background: '#ffffff',
                }}>
                    <div
                        className="form-card"
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            position: 'relative',
                            zIndex: 10,
                        }}
                    >
                        {/* Mobile logo */}
                        <div className="form-field field-1" style={{ marginBottom: '24px', textAlign: 'center' }} id="auth-mobile-logo">
                            <BeeGymLogo variant="full" size="lg" className="mx-auto" />
                        </div>

                        {/* Header */}
                        <div className="form-field field-1" style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <h1 className="font-display" style={{
                                color: '#0B0F1A',
                                fontSize: '28px',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                marginBottom: '8px',
                            }}>
                                Crie sua conta
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>
                                Insira seus dados para começar
                            </p>
                        </div>

                        {/* Google Button */}
                        <div className="form-field field-2" style={{ marginBottom: '20px' }}>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                                className="google-btn"
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    background: '#ffffff',
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: '6px',
                                    color: '#334155',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                }}
                            >
                                {googleLoading ? (
                                    <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFBF00" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                <span>Google</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="form-field field-2" style={{
                            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
                        }}>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>ou</span>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRegister} noValidate>
                            {error && (
                                <div className="form-field field-2" style={{
                                    padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '16px',
                                    display: 'flex', gap: '8px', color: '#b91c1c', fontSize: '13px'
                                }}>
                                    <span style={{ fontWeight: 700 }}>!</span> {error}
                                </div>
                            )}

                            {/* Name */}
                            <div className="form-field field-3" style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="form-field field-4" style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    placeholder="(11) 99999-9999"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="form-field field-5" style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="form-field field-6" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                                    required
                                />
                            </div>

                            {/* Submit button */}
                            <div className="form-field field-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{
                                        width: '100%', height: '48px', background: loading ? '#FFD700' : '#FFBF00', border: 'none', borderRadius: '6px',
                                        color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 191, 0,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {loading ? (
                                        <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    ) : 'Criar minha conta'}
                                </button>
                            </div>
                        </form>

                        {/* Login link */}
                        <div className="form-field field-6" style={{ textAlign: 'center', marginTop: '24px' }}>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>
                                Já tem uma conta?{' '}
                                <Link href="/app/login" style={{ color: '#FFBF00', fontWeight: 600, textDecoration: 'none' }}>
                                    Entrar
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {mounted && <ResponsiveStyle />}
            </div>
        </>
    )
}

function ResponsiveStyle() {
    return (
        <style>{`
      @media (min-width: 1024px) {
        #auth-left-panel   { display: flex !important; width: 50%; }
        #auth-mobile-logo  { display: none !important; }
        .auth-root > div:last-of-type { flex: 1; }
      }
      @media (max-width: 1023px) {
        #auth-left-panel  { display: none !important; }
        #auth-mobile-logo { display: block !important; }
      }
    `}</style>
    )
}

function HexGrid() {
    const hexagons = [
        { size: 320, top: '-80px', right: '-80px', opacity: 0.07, delay: '0s' },
        { size: 200, top: '30%', right: '-40px', opacity: 0.05, delay: '-2s' },
        { size: 160, bottom: '10%', left: '-40px', opacity: 0.06, delay: '-5s' },
        { size: 240, bottom: '-60px', right: '20%', opacity: 0.04, delay: '-3s' },
    ]

    return (
        <>
            {hexagons.map((h, i) => (
                <div
                    key={i}
                    className={i % 2 === 0 ? 'hex-bg' : 'hex-bg-2'}
                    style={{
                        position: 'absolute',
                        width: h.size, height: h.size, top: h.top, right: h.right, bottom: h.bottom, left: h.left,
                        opacity: h.opacity, animationDelay: h.delay,
                    }}
                    aria-hidden="true"
                >
                    <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%' }}>
                        <polygon points="50,2 93,25 93,75 50,98 7,75 7,25" stroke="#FFBF00" strokeWidth="1.5" fill="none" />
                    </svg>
                </div>
            ))}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(135deg, transparent 40%, rgba(255, 191, 0,0.03) 60%, transparent 70%)',
                pointerEvents: 'none',
            }} />
        </>
    )
}
