import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api"

interface Settlement {
    id: number
    amount: number
    status: string
    seller: {
        name: string
        iban: string
    }
    xml_content?: string
}

export function Settlements() {
    const { saleId } = useParams()
    const [settlements, setSettlements] = useState<Settlement[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [xmlContent, setXmlContent] = useState("")

    const fetchSettlements = async () => {
        if (!saleId) return
        setLoading(true)
        try {
            const response = await api.get(`/settlements/${saleId}/list`)
            setSettlements(response.data)
            // Check if any has XML content to enable download
            if (response.data.length > 0 && response.data[0].xml_content) {
                setXmlContent(response.data[0].xml_content)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettlements()
    }, [saleId])

    const handleGenerate = async () => {
        if (!saleId) return
        setGenerating(true)
        setMessage("")
        setError("")
        setXmlContent("")
        try {
            const response = await api.post(`/settlements/${saleId}/generate`)
            setMessage(response.data.message)
            setXmlContent(response.data.xml_content)
            fetchSettlements()
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur lors de la génération")
        } finally {
            setGenerating(false)
        }
    }

    const handleDownloadXml = () => {
        if (!xmlContent) return
        const blob = new Blob([xmlContent], { type: "text/xml" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `SEPA_PAIN001_${new Date().toISOString().split('T')[0]}.xml`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Règlements Vendeurs</h2>
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={generating}>
                        {generating ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Calcul en cours...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Calculer les Règlements
                            </>
                        )}
                    </Button>
                    {xmlContent && (
                        <Button variant="outline" onClick={handleDownloadXml}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger SEPA XML
                        </Button>
                    )}
                </div>
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
                    <CardTitle>Décomptes Vendeurs - Vente #{saleId}</CardTitle>
                    <CardDescription>Liste des montants nets à payer aux vendeurs.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Chargement...</div>
                    ) : settlements.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">Aucun règlement généré.</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendeur</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IBAN</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Montant Net</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {settlements.map((settlement) => (
                                        <tr key={settlement.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{settlement.seller.name}</td>
                                            <td className="p-4 align-middle font-mono text-xs">{settlement.seller.iban || "Non renseigné"}</td>
                                            <td className="p-4 align-middle font-bold">{settlement.amount.toFixed(2)} €</td>
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-500 text-white shadow hover:bg-blue-600">
                                                    {settlement.status}
                                                </span>
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
