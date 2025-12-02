import { useState } from "react"
import { useParams } from "react-router-dom"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { api } from "@/lib/api"

interface ImportedItem {
    lot_number: number;
    description: string;
    seller_name: string;
}

export function ImportMapping() {
    const { saleId } = useParams()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [importedItems, setImportedItems] = useState<ImportedItem[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStatus("idle")
            setMessage("")
            setImportedItems([])
        }
    }

    const handleUpload = async () => {
        if (!file || !saleId) return

        setStatus("uploading")
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await api.post(`/import/mapping/${saleId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            setStatus("success")
            setMessage(`Fichier "${file.name}" importé avec succès !`)
            setImportedItems(response.data.imported_items || [])
        } catch (error: any) {
            setStatus("error")
            setMessage(error.response?.data?.detail || "Erreur lors de l'import du fichier.")
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Import Mapping Vendeur</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nouveau Fichier</CardTitle>
                    <CardDescription>
                        Sélectionnez le fichier Excel (.xlsx) contenant le mapping des lots et vendeurs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="mapping-file">Fichier Excel</Label>
                        <Input id="mapping-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                    </div>

                    {status === "error" && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}

                    {status === "success" && (
                        <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">{message}</span>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || status === "uploading"}
                            className="gap-2"
                        >
                            {status === "uploading" ? (
                                "Import en cours..."
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Importer le fichier
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {importedItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Résumé de l'import</CardTitle>
                        <CardDescription>
                            Liste des lots importés ({importedItems.length} lots).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">N° Lot</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Vendeur</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {importedItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.lot_number}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.seller_name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
