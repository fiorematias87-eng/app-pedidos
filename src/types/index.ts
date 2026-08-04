// This file centralizes the TypeScript types for the application, including Pedido, Producto, Repartidor, and EstadoPedido.

export interface Pedido {
    id: string;
    clienteId: string;
    productos: Producto[];
    estado: EstadoPedido;
    fechaCreacion: Date;
    fechaEntrega?: Date;
}

export interface Producto {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
}

export interface Repartidor {
    id: string;
    nombre: string;
    telefono: string;
    vehiculo: string;
}

export enum EstadoPedido {
    PENDIENTE = 'pendiente',
    EN_CAMINO = 'en_camino',
    ENTREGADO = 'entregado',
    CANCELADO = 'cancelado',
}