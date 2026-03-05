import { BeeGymLogo } from '@/components/ui/beegym-logo'
import { AdminLoginButton } from '@/components/admin/auth/admin-login-button'

export const metadata = {
    title: 'Login Admin | BeeGym',
    description: 'Acesso restrito à administração do BeeGym',
}

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-transparent"></div>
                        <BeeGymLogo className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
                        Acesso Restrito
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Área exclusiva para administração do BeeGym
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-gray-100">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 text-center mb-6">Administrador</h3>
                                <AdminLoginButton />
                            </div>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-gray-500 font-medium">Acesso Seguro</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-500 mt-6">
                                Este ambiente requer privilégios elevados. O acesso por usuários não autorizados será bloqueado e auditado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
