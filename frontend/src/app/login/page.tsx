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

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) { toast.error(error.message); return }
            router.push("/pedidos")
            router.refresh()
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0F0E0C] px-4"
            style={{
                backgroundImage: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(251,191,36,0.06) 0%, transparent 70%)"
            }}>

            <div className="w-full max-w-sm">
                {/* Card */}
                <div
                    className="rounded-2xl border border-[#2A2825] p-8 space-y-8"
                    style={{
                        background: "#1C1A17",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(251,191,36,0.04)"
                    }}
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                        <Image
                            src="/logo-baccaro.png"
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
