create table if not exists tienda_config (
  id text primary key default 'store',
  nombre text not null default 'Mi Delivery',
  descripcion text default 'Delivery SaaS',
  subtitulo text default 'Rotisería y Comidas',
  logo_url text,
  portada_url text,
  direccion text,
  telefono text,
  cbu_cvu text,
  alias text
);

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden integer not null default 1,
  activa boolean not null default true
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio numeric not null default 0,
  imagen_url text,
  disponible boolean not null default true
);

create table if not exists repartidores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  estado text not null default 'disponible' check (estado in ('disponible','ocupado','inactivo'))
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_nombre text not null,
  cliente_telefono text,
  cliente_direccion text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  costo_envio numeric not null default 0,
  total numeric not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_cocina','en_camino','entregado','cancelado')),
  repartidor_id uuid references repartidores(id) on delete set null,
  notas text,
  metodo_entrega text default 'delivery' check (metodo_entrega in ('delivery','retiro')),
  metodo_pago text default 'efectivo' check (metodo_pago in ('efectivo','transferencia')),
  paga_con text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  lat double precision,
  lng double precision
);

alter table tienda_config enable row level security;
alter table categorias enable row level security;
alter table productos enable row level security;
alter table repartidores enable row level security;
alter table pedidos enable row level security;

create publication if not exists supabase_realtime for table tienda_config, categorias, productos, repartidores, pedidos;
