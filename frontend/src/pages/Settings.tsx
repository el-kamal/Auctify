import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const companySettingsSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    siret: z.string().min(1, "Le SIRET est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    iban: z.string().min(1, "L'IBAN est requis"),
    bic: z.string().min(1, "Le BIC est requis"),
    logo_url: z.string().optional(),
    logo_bordereau: z.string().optional(),
    logo_facture: z.string().optional(),
    logo_decompte: z.string().optional(),
    legal_mentions: z.string().optional(),
})

type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>

export function SettingsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [uploading, setUploading] = useState<string | null>(null)
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertTitle, setAlertTitle] = useState("")
    const [alertMessage, setAlertMessage] = useState("")

    const form = useForm<CompanySettingsFormValues>({
        resolver: zodResolver(companySettingsSchema),
        defaultValues: {
            name: "",
            siret: "",
            address: "",
            iban: "",
            bic: "",
            logo_url: "",
            logo_bordereau: "",
            logo_facture: "",
            logo_decompte: "",
            legal_mentions: "",
        },
    })

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            navigate('/dashboard')
            return
        }

        const fetchSettings = async () => {
            try {
                const response = await api.get("/company")
                form.reset(response.data)
            } catch (error) {
                console.error("Failed to fetch settings", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [user, navigate, form])

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(type)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", type)

        try {
            const response = await api.post("/company/upload-logo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            const url = response.data.url
            // Update the form field with the new URL
            if (type === 'bordereau') form.setValue("logo_bordereau", url)
            else if (type === 'facture') form.setValue("logo_facture", url)
            else if (type === 'decompte') form.setValue("logo_decompte", url)
            else if (type === 'main') form.setValue("logo_url", url)

            // Trigger a save or just let the user save manually?
            // Let's let the user save manually to confirm changes, but maybe show a preview?
            // For now, just setting the value is enough, the user will click "Save".

        } catch (error) {
            console.error("Upload failed", error)
            console.error("Upload failed", error)
            setAlertTitle("Erreur")
            setAlertMessage("Échec du téléchargement du logo")
            setAlertOpen(true)
        } finally {
            setUploading(null)
        }
    }

    const onSubmit = async (data: CompanySettingsFormValues) => {
        setIsSaving(true)
        try {
            await api.put("/company", data)
            setAlertTitle("Succès")
            setAlertMessage("Paramètres mis à jour avec succès")
            setAlertOpen(true)
        } catch (error) {
            console.error("Failed to save settings", error)
            console.error("Failed to save settings", error)
            setAlertTitle("Erreur")
            setAlertMessage("Erreur lors de la sauvegarde")
            setAlertOpen(true)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div>Chargement...</div>
    }

    if (!user || user.role !== 'ADMIN') {
        return null
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Paramètres de l'entreprise</h3>
                <p className="text-sm text-muted-foreground">
                    Gérez les informations légales et bancaires de votre entreprise.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                    <CardDescription>
                        Ces informations apparaîtront sur vos factures et documents officiels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom de l'entreprise</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Auctify SAS" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="siret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SIRET</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 456 789 00012" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="123 Rue de la Paix, 75000 Paris" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Logos Section */}
                            <div className="space-y-4 border p-4 rounded-md">
                                <h4 className="font-medium">Logos des Documents</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormItem>
                                        <FormLabel>Logo Bordereau</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'bordereau')}
                                                    disabled={uploading === 'bordereau'}
                                                />
                                                {form.watch("logo_bordereau") && (
                                                    <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Logo actuel :</p>
                                                        <div className="flex justify-center bg-white border rounded p-2">
                                                            <img
                                                                src={form.watch("logo_bordereau")}
                                                                alt="Logo Bordereau"
                                                                className="h-24 object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none'
                                                                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-xs text-red-500">Erreur chargement image (Vérifiez les droits d\'accès)</span>')
                                                                    console.error("Failed to load image:", form.watch("logo_bordereau"))
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel>Logo Facture</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'facture')}
                                                    disabled={uploading === 'facture'}
                                                />
                                                {form.watch("logo_facture") && (
                                                    <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Logo actuel :</p>
                                                        <div className="flex justify-center bg-white border rounded p-2">
                                                            <img
                                                                src={form.watch("logo_facture")}
                                                                alt="Logo Facture"
                                                                className="h-24 object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none'
                                                                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-xs text-red-500">Erreur chargement image (Vérifiez les droits d\'accès)</span>')
                                                                    console.error("Failed to load image:", form.watch("logo_facture"))
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel>Logo Décompte</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'decompte')}
                                                    disabled={uploading === 'decompte'}
                                                />
                                                {form.watch("logo_decompte") && (
                                                    <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Logo actuel :</p>
                                                        <div className="flex justify-center bg-white border rounded p-2">
                                                            <img
                                                                src={form.watch("logo_decompte")}
                                                                alt="Logo Décompte"
                                                                className="h-24 object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none'
                                                                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-xs text-red-500">Erreur chargement image (Vérifiez les droits d\'accès)</span>')
                                                                    console.error("Failed to load image:", form.watch("logo_decompte"))
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="iban"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IBAN</FormLabel>
                                            <FormControl>
                                                <Input placeholder="FR76 ..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BIC</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ABCDFRPP" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="legal_mentions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mentions Légales (Pied de page)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="TVA Intracommunautaire..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
