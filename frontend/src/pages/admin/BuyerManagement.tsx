import { useState, useEffect } from "react"
import { ActorsService, Actor, ActorCreate } from "../../lib/api"
import { Plus, Edit, Trash2, X, Search } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function BuyerManagement() {
    const [buyers, setBuyers] = useState<Actor[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBuyer, setEditingBuyer] = useState<Actor | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [buyerToDelete, setBuyerToDelete] = useState<number | null>(null)
    const [formData, setFormData] = useState<ActorCreate>({
        name: "",
        type: "BUYER",
        email: "",
        phone_number: "",
        siren_siret: "",
        address: "",
        iban: "",
        bic: "",
        vat_subject: false
    })

    useEffect(() => {
        fetchBuyers()
    }, [])

    const fetchBuyers = async () => {
        try {
            const data = await ActorsService.getActors("BUYER")
            setBuyers(data)
        } catch (error: any) {
            console.error("Failed to fetch buyers", error)
            setError(error.message || "Impossible de charger les acheteurs")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (buyer?: Actor) => {
        if (buyer) {
            setEditingBuyer(buyer)
            setFormData({
                name: buyer.name,
                type: "BUYER",
                email: buyer.email || "",
                phone_number: buyer.phone_number || "",
                siren_siret: buyer.siren_siret || "",
                address: buyer.address || "",
                iban: buyer.iban || "",
                bic: buyer.bic || "",
                vat_subject: buyer.vat_subject
            })
        } else {
            setEditingBuyer(null)
            setFormData({
                name: "",
                type: "BUYER",
                email: "",
                phone_number: "",
                siren_siret: "",
                address: "",
                iban: "",
                bic: "",
                vat_subject: false
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingBuyer(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingBuyer) {
                await ActorsService.updateActor(editingBuyer.id, formData)
            } else {
                await ActorsService.createActor(formData)
            }
            fetchBuyers()
            handleCloseModal()
        } catch (error) {
            console.error("Failed to save buyer", error)
        }
    }

    const handleDeleteClick = (id: number) => {
        setBuyerToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (buyerToDelete === null) return
        try {
            await ActorsService.deleteActor(buyerToDelete)
            fetchBuyers()
        } catch (error: any) {
            console.error("Failed to delete buyer", error)
            setError(error.message || "Une erreur est survenue lors de la suppression de l'acheteur.")
        } finally {
            setDeleteDialogOpen(false)
            setBuyerToDelete(null)
        }
    }

    const filteredBuyers = buyers.filter(buyer =>
        buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.email && buyer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (buyer.phone_number && buyer.phone_number.includes(searchTerm)) ||
        (buyer.siren_siret && buyer.siren_siret.includes(searchTerm))
    )

    if (loading) return <div className="p-8">Chargement...</div>
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des acheteurs</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Nouvel acheteur
                </button>
            </div>

            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Rechercher par nom, email, téléphone ou SIREN/SIRET..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIREN/SIRET</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVA</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBuyers.map((buyer) => (
                            <tr key={buyer.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{buyer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{buyer.email || "-"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{buyer.phone_number || "-"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{buyer.siren_siret || "-"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${buyer.vat_subject ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {buyer.vat_subject ? 'Oui' : 'Non'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(buyer)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(buyer.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingBuyer ? "Modifier l'acheteur" : "Nouvel acheteur"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.phone_number || ""}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">SIREN/SIRET</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.siren_siret || ""}
                                        onChange={(e) => setFormData({ ...formData, siren_siret: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IBAN</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.iban}
                                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">BIC</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.bic}
                                        onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={formData.vat_subject}
                                        onChange={(e) => setFormData({ ...formData, vat_subject: e.target.checked })}
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">Assujetti à la TVA</label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cet acheteur ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
