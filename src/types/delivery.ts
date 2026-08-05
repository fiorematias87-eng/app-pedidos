export type EstadoPedido = 'pendiente' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado';

export interface TiendaConfig {
  id: string;
  nombre: string;
  descripcion?: string | null;
  subtitulo?: string | null;
  logo_url?: string | null;
  portada_url?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  banco?: string | null;
  titular_nombre?: string | null;
  titular_cuit?: string | null;
  cbu_cvu?: string | null;
  alias?: string | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url?: string | null;
  disponible: boolean;
}

export interface Repartidor {
  id: string;
  nombre: string;
  telefono: string;
  estado: 'disponible' | 'ocupado' | 'inactivo';
}

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
  repartidor_id?: string | null;
  notas?: string | null;
  metodo_entrega?: 'delivery' | 'retiro' | null;
  metodo_pago?: 'efectivo' | 'transferencia' | null;
  created_at: string;
  updated_at?: string | null;
  lat?: number | null;
  lng?: number | null;
}
