import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export interface Auction {
    id: number
    name: string
    date: string
    status: string
    buyer_fee_rate: number
    seller_fee_rate: number
}

export interface AuctionCreate {
    name: string
    date?: string
    status?: string
    buyer_fee_rate?: number
    seller_fee_rate?: number
}

export interface AuctionUpdate {
    name?: string
    date?: string
    status?: string
    buyer_fee_rate?: number
    seller_fee_rate?: number
}

export const AuctionsService = {
    getAuctions: async () => {
        const response = await api.get<Auction[]>("/auctions/")
        return response.data
    },
    createAuction: async (data: AuctionCreate) => {
        const response = await api.post<Auction>("/auctions/", data)
        return response.data
    },
    updateAuction: async (id: number, data: AuctionUpdate) => {
        const response = await api.put<Auction>(`/auctions/${id}`, data)
        return response.data
    },
    deleteAuction: async (id: number) => {
        const response = await api.delete<Auction>(`/auctions/${id}`)
        return response.data
    },
}

export interface User {
    id: number
    email: string
    full_name: string
    role: string
    is_active: boolean
}

export interface UserCreate {
    email: string
    password: string
    full_name?: string
    role?: string
    is_active?: boolean
}

export interface UserUpdate {
    email?: string
    password?: string
    full_name?: string
    role?: string
    is_active?: boolean
}

export const UsersService = {
    getUsers: async () => {
        const response = await api.get<User[]>("/users/")
        return response.data
    },
    createUser: async (data: UserCreate) => {
        const response = await api.post<User>("/users/", data)
        return response.data
    },
    updateUser: async (id: number, data: UserUpdate) => {
        const response = await api.put<User>(`/users/${id}`, data)
        return response.data
    },
    deleteUser: async (id: number) => {
        const response = await api.delete<User>(`/users/${id}`)
        return response.data
    },
}

export { api }
