import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AuctionsService, Auction, AuctionCreate } from "../../lib/api"
import { Plus, Edit, Trash2, X, Settings } from "lucide-react"



export default function SalesManagement() {
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CREATED': return 'Créé'
            case 'MAPPED': return 'Mappé'
            case 'CLOSED': return 'Fermé'
            default: return status
        }
    }

    const [auctions, setAuctions] = useState<Auction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAuction, setEditingAuction] = useState<Auction | null>(null)
    const [formData, setFormData] = useState<AuctionCreate>({
        name: "",
        date: new Date().toISOString().split('T')[0],
        status: "CREATED",
        buyer_fee_rate: 0.20,
        seller_fee_rate: 0.05,
        platform_fee_rate: 0.0
    })

    useEffect(() => {
        fetchAuctions()
    }, [])

    const fetchAuctions = async () => {
        try {
            const data = await AuctionsService.getAuctions()
            setAuctions(data)
        } catch (error: any) {
            console.error("Failed to fetch auctions", error)
            setError(error.message || "Impossible de charger les ventes")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (auction?: Auction) => {
        if (auction) {
            setEditingAuction(auction)
            setFormData({
                name: auction.name,
                date: auction.date ? new Date(auction.date).toISOString().split('T')[0] : "",
                status: auction.status,
                buyer_fee_rate: auction.buyer_fee_rate,
                seller_fee_rate: auction.seller_fee_rate,
                platform_fee_rate: auction.platform_fee_rate
            })
        } else {
            setEditingAuction(null)
            setFormData({
                name: "",
                date: new Date().toISOString().split('T')[0],
                status: "CREATED",
                buyer_fee_rate: 0.20,
                seller_fee_rate: 0.05,
                platform_fee_rate: 0.0
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingAuction(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingAuction) {
                await AuctionsService.updateAuction(editingAuction.id, formData)
            } else {
                await AuctionsService.createAuction(formData)
            }
            fetchAuctions()
            handleCloseModal()
        } catch (error) {
            console.error("Failed to save auction", error)
        }
    }

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
            try {
                await AuctionsService.deleteAuction(id)
                fetchAuctions()
            } catch (error: any) {
                console.error("Failed to delete auction", error)
                setError(error.message || "Une erreur est survenue lors de la suppression de la vente.")
            }
        }
    }

    if (loading) return <div className="p-8">Chargement...</div>
    if (error) return <div className="p-8 text-red-600">Erreur: {error}</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des ventes</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Nouvelle vente
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais acheteur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais vendeur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais plateforme</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {auctions.map((auction) => (
                            <tr key={auction.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">{auction.number || "-"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{auction.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {auction.date ? new Date(auction.date).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${auction.status === 'CREATED' ? 'bg-green-100 text-green-800' :
                                            auction.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {getStatusLabel(auction.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{(auction.buyer_fee_rate * 100).toFixed(2).replace('.', ',')}%</td>
                                <td className="px-6 py-4 whitespace-nowrap">{(auction.seller_fee_rate * 100).toFixed(2).replace('.', ',')}%</td>
                                <td className="px-6 py-4 whitespace-nowrap">{(auction.platform_fee_rate * 100).toFixed(2).replace('.', ',')}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end items-center gap-4">
                                        <Link
                                            to={`/sales/${auction.id}/import-mapping`}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Gérer"
                                        >
                                            <Settings size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleOpenModal(auction)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(auction.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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
                                {editingAuction ? "Modifier la vente" : "Nouvelle vente"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {editingAuction && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Numéro</label>
                                        <input
                                            type="text"
                                            disabled
                                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm border p-2 text-gray-500"
                                            value={editingAuction.number || "Généré automatiquement"}
                                        />
                                    </div>
                                )}
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
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="CREATED">Créé</option>
                                        <option value="MAPPED">Mappé</option>
                                        <option value="CLOSED">Fermé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Frais acheteur</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.buyer_fee_rate}
                                        onChange={(e) => setFormData({ ...formData, buyer_fee_rate: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Frais vendeur</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.seller_fee_rate}
                                        onChange={(e) => setFormData({ ...formData, seller_fee_rate: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Frais plateforme</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                        value={formData.platform_fee_rate}
                                        onChange={(e) => setFormData({ ...formData, platform_fee_rate: parseFloat(e.target.value) })}
                                    />
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
        </div>
    )
}
