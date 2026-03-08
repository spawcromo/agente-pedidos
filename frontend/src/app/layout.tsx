import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { UserProvider } from "@/contexts/UserContext"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Avícola Baccaro — Gestión de Pedidos",
  description: "Sistema de gestión de pedidos y logística para Avícola Baccaro",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <UserProvider>
          {children}
        </UserProvider>
        <Toaster theme="dark" position="bottom-right" richColors toastOptions={{
          style: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }
        }} />
      </body>
    </html>
  )
}
