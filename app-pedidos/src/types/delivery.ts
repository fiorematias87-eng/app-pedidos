export interface Producto {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    imagenUrl: string;
    alergenos?: string[];
}

export interface Pedido {
    id: string;
    productos: Producto[];
    estado: EstadoPedido;
    total: number;
    direccionEntrega: string;
    clienteId: string;
    repartidorId?: string;
    fechaCreacion: string;
    fechaEntrega?: string;
}

export enum EstadoPedido {
    PENDIENTE = "Pendiente",
    PREPARANDO = "Preparando",
    EN_CAMINO = "En Camino",
    ENTREGADO = "Entregado",
}