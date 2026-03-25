'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [imgError, setImgError] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('[Login] Tentando autenticação...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        console.warn('[Login] Erro no signIn:', signInError)
        setError('E-mail ou senha incorretos. Tente novamente.')
        setLoading(false)
        return
      }

      if (!data.user) {
        console.warn('[Login] Sem dados de usuário após login')
        setError('Erro ao obter dados do usuário.')
        setLoading(false)
        return
      }

      console.log('[Login] Autenticado com sucesso. Buscando perfil...')
      
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('organization_id, status, role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('[Login] Erro ao buscar perfil:', profileError)
        setError('Erro ao carregar seu perfil. Tente novamente.')
        setLoading(false)
        return
      }

      console.log('[Login] Perfil encontrado. Org ID:', profile?.organization_id)

      let org: any = null
      if (profile?.organization_id) {
        console.log('[Login] Buscando dados da organização...')
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('subscription_status, onboarding_completed')
          .eq('id', profile.organization_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (orgError) {
          console.error('[Login] Erro ao buscar organização:', orgError)
          setError('Erro ao carregar dados da organização.')
          setLoading(false)
          return
        }
        org = orgData
        console.log('[Login] Dados da organização obtidos:', org)
      }

      let destination = '/app/painel'
      const redirect = searchParams?.get('redirect')
      const status = (org?.subscription_status || '').toLowerCase().trim()

      if (!profile?.organization_id || !org?.onboarding_completed) {
        console.log('[Login] Onboarding incompleto ou sem organização. Roteando para onboarding.')
        destination = '/app/onboarding'
      } else if (status === 'pending') {
        console.log('[Login] Pagamento pendente. Roteando para paywall.')
        destination = '/app/pending-activation'
      } else if (['active', 'trial'].includes(status)) {
        console.log('[Login] Assinatura ativa ou trial. Roteando para destino principal.')
        destination = redirect || '/app/painel'
      } else {
        console.warn('[Login] Status desconhecido ou bloqueado:', status)
        destination = '/app/pending-activation'
      }

      console.log('[Login] Redirecionando em instantes para:', destination)
      
      setTimeout(() => {
        window.location.assign(destination)
      }, 100)

    } catch (err: any) {
      console.error('[Login] Erro inesperado:', err)
      setError('Ocorreu um erro inesperado ao realizar o login. Tente novamente.')
      setLoading(false)
    } finally {
      // setLoading(false) already handled in returns/catches if needed
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .login-root {
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
        .field-1  { animation-delay: 0.2s; }
        .field-2  { animation-delay: 0.28s; }
        .field-3  { animation-delay: 0.36s; }
        .field-4  { animation-delay: 0.44s; }
        .field-5  { animation-delay: 0.52s; }

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

        .eye-btn { transition: color 0.15s ease; }
        .eye-btn:hover { color: #FFBF00; }

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
        className="login-root"
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
          id="login-left-panel"
        >
          {/* Hexagonal decorative geometry */}
          <HexGrid />

          {/* Orange accent line top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #FFBF00, #E67E22, transparent)',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 10,
            padding: '48px',
            display: 'flex', flexDirection: 'column', height: '100%',
          }}>
            <div>
              <BeeGymLogo variant="dark" size="lg" />
            </div>

            {/* Headline — positioned toward bottom */}
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
                Sua academia no<br />
                <span className="text-bee-amber">próximo nível.</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.6, maxWidth: '380px' }}>
                Gestão inteligente de alunos, treinos e finanças — tudo em um só lugar.
              </p>

              {/* Trust signal */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginTop: '40px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex' }}>
                  {['#E67E22', '#FFBF00', '#FFD700'].map((c, i) => (
                    <div key={i} style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: c, border: '2px solid #0B0F1A',
                      marginLeft: i > 0 ? '-8px' : '0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: '#0B0F1A',
                    }}>
                      {['A', 'B', 'C'][i]}
                    </div>
                  ))}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  Confiado por academias em todo o Brasil
                </span>
              </div>
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
            {/* Mobile logo (Dark version for light theme) */}
            <div className="form-field field-1" style={{ marginBottom: '32px', textAlign: 'center' }} id="login-mobile-logo">
              <BeeGymLogo variant="light" size="lg" className="mx-auto" />
            </div>

            {/* Header */}
            <div className="form-field field-1" style={{ marginBottom: '32px', textAlign: 'center' }} id="login-header-section">
              <h1 className="font-display" style={{
                color: '#0B0F1A',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}>
                Bem-vindo de volta
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Orange divider */}
            <div className="form-field field-2" style={{ marginBottom: '28px' }} id="login-google-section">
              {/* Google Button */}
              <button
                id="login-google-btn"
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
                  letterSpacing: '0.01em',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                aria-label="Entrar com Google"
              >
                {googleLoading ? (
                  <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFBF00" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span>{googleLoading ? 'Redirecionando...' : 'Entrar com Google'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="form-field field-2" style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} noValidate>
              {/* Error message */}
              {error && (
                <div
                  className="form-field field-2"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    marginBottom: '20px',
                  }}
                  role="alert"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                    <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span style={{ color: '#b91c1c', fontSize: '13px', lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="form-field field-3" style={{ marginBottom: '16px' }} id="login-email-field">
                <label
                  htmlFor="login-email"
                  style={{ display: 'block', color: '#475569', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}
                >
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="input-field"
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '6px',
                      paddingLeft: '42px',
                      paddingRight: '14px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    aria-label="Endereço de e-mail"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-field field-4" style={{ marginBottom: '8px' }} id="login-password-field">
                <label
                  htmlFor="login-password"
                  style={{ display: 'block', color: '#475569', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}
                >
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field"
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '6px',
                      paddingLeft: '42px',
                      paddingRight: '48px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    aria-label="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-btn"
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', padding: '4px',
                      display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="form-field field-4" style={{ textAlign: 'right', marginBottom: '28px' }} id="login-forgot-password">
                <Link
                  href="/auth/forgot-password"
                  style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFBF00')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  Esqueci minha senha
                </Link>
              </div>

              {/* Submit button */}
              <div className="form-field field-5" id="login-submit-section">
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '50px',
                    background: loading ? 'rgba(255, 191, 0,0.5)' : '#FFBF00',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    letterSpacing: '0.01em',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 191, 0,0.25)',
                  }}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar painel</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Register link */}
            <div className="form-field field-5" style={{ textAlign: 'center', marginTop: '28px' }} id="login-register-link">
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                Não tem uma conta?{' '}
                <Link
                  href="/register"
                  style={{ color: '#FFBF00', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Crie sua conta
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
            }}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>© 2026 BeeGym</span>
              <a href="#" style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                Privacidade
              </a>
              <a href="#" style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                Termos
              </a>
            </div>
          </div>
        </div>

        {/* Responsive layout via JS-injected style */}
        {mounted && <ResponsiveStyle />}
      </div>
    </>
  )
}

function ResponsiveStyle() {
  return (
    <style>{`
      @media (min-width: 1024px) {
        #login-left-panel   { display: flex !important; width: 50%; }
        #login-mobile-logo  { display: none !important; }
        .login-root > div:last-of-type { flex: 1; }
      }
      @media (max-width: 1023px) {
        #login-left-panel  { display: none !important; }
        #login-mobile-logo { display: block !important; }
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
            width: h.size,
            height: h.size,
            top: h.top,
            right: h.right,
            bottom: h.bottom,
            left: h.left,
            opacity: h.opacity,
            animationDelay: h.delay,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <polygon
              points="50,2 93,25 93,75 50,98 7,75 7,25"
              stroke="#FFBF00"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      ))}
      {/* Diagonal orange stripe */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, transparent 40%, rgba(255, 191, 0,0.03) 60%, transparent 70%)',
        pointerEvents: 'none',
      }} />
    </>
  )
}
