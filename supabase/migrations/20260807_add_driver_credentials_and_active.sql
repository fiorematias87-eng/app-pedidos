alter table repartidores
  add column if not exists usuario text,
  add column if not exists pin text,
  add column if not exists activo boolean not null default true;
