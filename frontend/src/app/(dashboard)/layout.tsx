"use client"

import Image from "next/image"
import { useState } from "react"
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
            <header className="sticky top-0 z-40 flex h-16 items-center border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        />
                    }>
                        <span className="text-xl">☰</span>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border">
                        <SidebarContent onNavItemClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
                <Link href="/inicio" className="ml-4 relative h-10 w-32 transition-opacity hover:opacity-80">
                    <Image
                        src="/logo-baccaro.svg"
                        alt="Avícola Baccaro"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </Link>
            </header>

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    )
}
