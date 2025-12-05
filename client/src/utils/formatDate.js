export default function formatDate(dateString) {
    if (!dateString) return 'N/A'

    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'N/A'

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}
