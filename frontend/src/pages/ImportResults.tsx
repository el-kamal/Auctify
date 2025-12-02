import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api"

export function ImportResults() {
    const { saleId } = useParams()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [stats, setStats] = useState<any>(null)

    // Results & Filters
    const [results, setResults] = useState<any[]>([])
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [filterSeller, setFilterSeller] = useState<string>("")
    const [loadingResults, setLoadingResults] = useState(false)

    const fetchResults = async () => {
        if (!saleId) return
        setLoadingResults(true)
        try {
            const params: any = {}
            if (filterStatus !== "ALL") params.status = filterStatus
            if (filterSeller) params.seller_name = filterSeller

            const response = await api.get(`/reconciliation/${saleId}/results`, { params })
            setResults(response.data)
        } catch (error) {
            console.error("Failed to fetch results", error)
        } finally {
            setLoadingResults(false)
        }
    }

    // Fetch stats on load
    useEffect(() => {
        if (saleId) {
            api.get(`/reconciliation/${saleId}/stats`).then(res => setStats(res.data)).catch(console.error)
            fetchResults()
        }
    }, [saleId])

    // Refetch results when filters change
    useEffect(() => {
        fetchResults()
    }, [filterStatus, filterSeller])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStatus("idle")
            setMessage("")
            setStats(null)
        }
    }

    const handleUpload = async () => {
        if (!file || !saleId) return

        setStatus("uploading")
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await api.post(`/reconciliation/${saleId}/import`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            setStatus("success")
            setMessage("Réconciliation terminée avec succès !")
            setStats(response.data.stats)
            fetchResults() // Refresh results
        } catch (error: any) {
            setStatus("error")
            setMessage(error.response?.data?.detail || "Erreur lors de l'import du fichier.")
            console.error(error)
        }
    }

    const handleExport = async () => {
        if (!saleId) return
        try {
            const params: any = {}
            if (filterStatus !== "ALL") params.status = filterStatus
            if (filterSeller) params.seller_name = filterSeller

            const response = await api.get(`/reconciliation/${saleId}/export`, {
                params,
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `resultats_vente_${saleId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Import Résultats de Vente</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fichier de Résultats (CSV)</CardTitle>
                    <CardDescription>
                        Sélectionnez le fichier CSV exporté depuis le logiciel d'enchères.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="results-file">Fichier CSV</Label>
                        <Input id="results-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>

                    {status === "error" && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}

                    {status === "success" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">{message}</span>
                            </div>
                        </div>
                    )}

                    {stats && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Traités</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{stats.processed || 0}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Vendus</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-green-600">{stats.matched || 0}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-500">Invendus</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-orange-500">{stats.unsold || 0}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-500">Anomalies</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-red-500">{stats.anomalies || 0}</div></CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || status === "uploading"}
                            className="gap-2"
                        >
                            {status === "uploading" ? (
                                "Réconciliation en cours..."
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Lancer la Réconciliation
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Résultats Détaillés</CardTitle>
                            <CardDescription>Liste des lots avec leur statut de réconciliation.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <FileText className="h-4 w-4" />
                            Exporter Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="w-48">
                            <Label>Statut</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">Tous</option>
                                <option value="SOLD">Vendus</option>
                                <option value="UNSOLD">Invendus</option>
                            </select>
                        </div>
                        <div className="w-64">
                            <Label>Vendeur</Label>
                            <Input
                                placeholder="Filtrer par vendeur..."
                                value={filterSeller}
                                onChange={(e) => setFilterSeller(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">N° Lot</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendeur</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Adjudication</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loadingResults ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center">Chargement...</td>
                                    </tr>
                                ) : results.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">Aucun résultat trouvé.</td>
                                    </tr>
                                ) : (
                                    results.map((item, index) => (
                                        <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{item.lot_number}</td>
                                            <td className="p-4 align-middle">{item.description}</td>
                                            <td className="p-4 align-middle">{item.seller_name}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent 
                                                    ${item.status === 'SOLD' ? 'bg-green-500 text-white' :
                                                        item.status === 'UNSOLD' ? 'bg-orange-500 text-white' :
                                                            'bg-red-500 text-white'}`}>
                                                    {item.status === 'SOLD' ? 'Vendu' : item.status === 'UNSOLD' ? 'Invendu' : item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">{item.hammer_price} €</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
