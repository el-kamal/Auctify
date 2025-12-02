import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api"

interface Invoice {
    id: number
    number: string
    total_incl: number
    status: string
    signature_date: string
    hash: string
}

export function Invoices() {
    const { saleId } = useParams()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const fetchInvoices = async () => {
        if (!saleId) return
        setLoading(true)
        try {
            const response = await api.get(`/invoices/${saleId}/list`)
            setInvoices(response.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [saleId])

    const handleGenerate = async () => {
        if (!saleId) return
        setGenerating(true)
        setMessage("")
        setError("")
        try {
            const response = await api.post(`/invoices/${saleId}/generate`)
            setMessage(response.data.message)
            fetchInvoices()
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur lors de la génération")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Factures</h2>
                <Button onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Génération en cours...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Générer les Factures
                        </>
                    )}
                </Button>
            </div>

            {message && (
                <Alert className="border-green-500 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Succès</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Factures de la Vente #{saleId}</CardTitle>
                    <CardDescription>Liste des factures générées et validées.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Chargement...</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">Aucune facture trouvée.</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Numéro</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Montant TTC</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{invoice.number}</td>
                                            <td className="p-4 align-middle">{new Date(invoice.signature_date).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle">{invoice.total_incl.toFixed(2)} €</td>
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white shadow hover:bg-green-600">
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Download className="h-4 w-4" />
                                                    PDF
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
