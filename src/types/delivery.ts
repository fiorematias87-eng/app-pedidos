export type EstadoPedido =
  | 'pendiente'
  | 'en_preparacion'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface Producto {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description?: string;
}

export interface Repartidor {
  id: string;
  nombre: string;
  telefono?: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  direccion: string;
  lat?: number;
  lng?: number;
  estado: EstadoPedido;
  productos: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  subtotal: number;
  envio: number;
  impuestos: number;
  total: number;
  repartidorId?: string;
  repartidorNombre?: string;
  notasAdmin?: string;
  createdAt: string;
  updatedAt: string;
}
