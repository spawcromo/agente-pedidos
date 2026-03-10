"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setIsSuccess(true) // Dispara la animación de salida

            // Espera a que termine la animación css antes de navegar
            setTimeout(() => {
                router.push("/inicio")
                router.refresh()
            }, 700)

        } catch (err) {
            setLoading(false)
        }
    }

    return (
        <main className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-all duration-1000 ${isSuccess ? 'bg-black' : ''}`}
            style={!isSuccess ? {
                backgroundColor: "#1c1917", // Muy oscuro de base
                backgroundImage: `
                    radial-gradient(circle at 50% 50%, #7c2d12 0%, #1c1917 100%)
                `,
            } : {}}>

            <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSuccess ? 'opacity-0 scale-110 blur-xl translate-y-8' : 'opacity-100 scale-100 blur-0 translate-y-0'
                }`}>
                {/* Card */}
                <div
                    className="rounded-[2.5rem] border border-white/5 p-10 space-y-8 backdrop-blur-3xl"
                    style={{
                        background: "rgba(24, 24, 27, 0.8)",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)"
                    }}
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                        <Image
                            src="/logo-baccaro.svg"
                            alt="Avícola Baccaro"
                            width={160}
                            height={60}
                            className="object-contain"
                            priority
                        />
                        <p className="text-sm text-[#9CA3AF] text-center">
                            Sistema de Gestión de Pedidos
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@baccaro.com"
                                required
                                className="w-full rounded-xl border border-[#2A2825] bg-[#0F0E0C] px-4 py-3 text-sm text-[#F9F7F4] placeholder:text-[#4B5563] outline-none transition-all duration-150 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border border-[#2A2825] bg-[#0F0E0C] px-4 py-3 text-sm text-[#F9F7F4] placeholder:text-[#4B5563] outline-none transition-all duration-150 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                            />
                        </div>

                        <button
                            id="btn-login"
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl py-3 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: loading
                                    ? "#92600c"
                                    : "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
                                color: "#0F0E0C",
                                boxShadow: loading ? "none" : "0 4px 16px rgba(251,191,36,0.25)"
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) (e.target as HTMLButtonElement).style.background = "linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)"
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) (e.target as HTMLButtonElement).style.background = "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)"
                            }}
                        >
                            {loading ? "Ingresando..." : "Ingresar →"}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-[11px] text-[#4B5563]">
                        Acceso exclusivo para el equipo de Avícola Baccaro
                    </p>
                </div>
            </div>
        </main>
    )
}
