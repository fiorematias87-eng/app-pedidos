export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
};

export const formatOrderStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        pending: 'Pendiente',
        preparing: 'Preparando',
        on_the_way: 'En Camino',
        delivered: 'Entregado',
    };
    return statusMap[status] || 'Estado Desconocido';
};