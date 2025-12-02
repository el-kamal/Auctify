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

const companySettingsSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    siret: z.string().min(1, "Le SIRET est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    iban: z.string().min(1, "L'IBAN est requis"),
    bic: z.string().min(1, "Le BIC est requis"),
    logo_url: z.string().optional(),
    legal_mentions: z.string().optional(),
})

type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>

export function SettingsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<CompanySettingsFormValues>({
        resolver: zodResolver(companySettingsSchema),
        defaultValues: {
            name: "",
            siret: "",
            address: "",
            iban: "",
            bic: "",
            logo_url: "",
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
                // If 404, we might want to leave fields empty or show a message
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [user, navigate, form])

    const onSubmit = async (data: CompanySettingsFormValues) => {
        setIsSaving(true)
        try {
            await api.put("/company", data)
            // Show success message (toast)
            alert("Paramètres mis à jour avec succès")
        } catch (error) {
            console.error("Failed to save settings", error)
            alert("Erreur lors de la sauvegarde")
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
        </div>
    )
}
