export interface ServiceOrder {
    id: string
    createdAt: string
    status: string
    totalAmount: number
    paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
    notes: string | null
    estimatedCompletion: string | null
    _count: {
        items: number
    }
    customer: {
        firstName: string
        lastName: string
        profilePicture?: string
    }
    vehicle: {
        make: string
        model: string
        licensePlate: string
    }
    mechanic: {
        name: string
        avatar?: string
        profilePicture?: string
    } | null
}
