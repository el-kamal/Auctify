import { Link, useLocation, useParams } from "react-router-dom"
import { LayoutDashboard, Upload, FileSpreadsheet, FileText, Banknote, Settings, LogOut, Gavel, ArrowLeft, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export function Sidebar() {
    const location = useLocation()
    const params = useParams()
    const { user, logout } = useAuth()
    const saleId = params.saleId

    const generalItems = [
        { icon: LayoutDashboard, label: "Tableau de Bord", href: "/dashboard", roles: ['ADMIN', 'CLERK'] },
        { icon: Gavel, label: "Gestion des ventes", href: "/sales", roles: ['ADMIN'] },
        { icon: Users, label: "Utilisateurs", href: "/users", roles: ['ADMIN'] },
        { icon: Settings, label: "Paramètres", href: "/settings", roles: ['ADMIN'] },
    ]

    const saleItems = saleId ? [
        { icon: FileSpreadsheet, label: "Import Mapping", href: `/sales/${saleId}/import-mapping`, roles: ['ADMIN', 'CLERK'] },
        { icon: Upload, label: "Import Résultats", href: `/sales/${saleId}/import-results`, roles: ['ADMIN', 'CLERK'] },
        { icon: FileText, label: "Factures", href: `/sales/${saleId}/invoices`, roles: ['ADMIN', 'CLERK'] },
        { icon: Banknote, label: "Décomptes", href: `/sales/${saleId}/settlements`, roles: ['ADMIN', 'CLERK'] },
    ] : []

    const itemsToShow = saleId ? saleItems : generalItems

    const filteredItems = itemsToShow.filter(item =>
        user && item.roles.includes(user.role)
    )

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-4">
                <span className="text-lg font-bold text-primary">Auctify</span>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {saleId && (
                        <Link
                            to="/sales"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux ventes
                        </Link>
                    )}

                    {filteredItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                location.pathname === item.href
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="mb-2 px-2 text-xs text-muted-foreground">
                    {user?.email} ({user?.role})
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </Button>
            </div>
        </div>
    )
}
