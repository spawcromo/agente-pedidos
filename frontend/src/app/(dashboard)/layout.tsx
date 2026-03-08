"use client"

import { useState } from "react"
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Header */}
            <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background px-4 lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                            <span className="sr-only">Toggle menu</span>
                            <span className="text-xl">☰</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border">
                        <SidebarContent onNavItemClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
                <div className="ml-4 font-bold text-amber-500">Agente Baccaro</div>
            </header>

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    )
}
