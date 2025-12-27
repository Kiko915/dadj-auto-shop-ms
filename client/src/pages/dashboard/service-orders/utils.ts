export const COLUMNS = {
    PENDING: 'Pending / Queue',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Ready for Release',
    CANCELLED: 'Cancelled'
}

export const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0
    }).format(value)
}

export const getInitials = (name: string | null | undefined) => {
    if (!name) return ''
    return name
        .trim()
        .split(/\s+/)
        .filter(part => part.length > 0)
        .map(part => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

export const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    const d = new Date(dateString)
    const now = new Date()
    d.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    return d < now
}

export const isDueToday = (dateString: string | null) => {
    if (!dateString) return false
    const d = new Date(dateString)
    const now = new Date()
    d.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    return d.getTime() === now.getTime()
}

export const getStatusVariant = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success'
        case 'IN_PROGRESS': return 'default' // Primary color
        case 'PENDING': return 'secondary'
        case 'CANCELLED': return 'destructive'
        default: return 'outline'
    }
}

export const formatStatus = (status: string | null | undefined): string => {
    if (!status) return ''
    return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
}
