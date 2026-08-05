import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Banknote, Copy, CreditCard, Home, MapPin, Search, ShoppingBag, Star, Store, Truck, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { pedidosService } from '../services/pedidos.service';
import { supabase } from '../lib/supabase';
import type { Categoria, Producto, TiendaConfig } from '../types/delivery';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type DeliveryMethod = 'delivery' | 'retiro';
type PaymentMethod = 'efectivo' | 'transferencia';

export default function HomeCliente() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [config, setConfig] = useState<TiendaConfig | null>(null);

  function normalizeTiendaConfig(raw: any): TiendaConfig | null {
    if (!raw) return null;
    return {
      id: raw.id || 'store',
      nombre: raw.nombre || raw.nombre_tienda || '',
      descripcion: raw.descripcion || raw.subtitulo || '',
      subtitulo: raw.subtitulo || raw.descripcion || '',
      direccion: raw.direccion || '',
      telefono: raw.telefono || raw.phone || '',
      logo_url: raw.logo_url || raw.logo || '',
      portada_url: raw.portada_url || raw.portada || '',
      banco: raw.banco || '',
      titular_nombre: raw.titular_nombre || '',
      titular_cuit: raw.titular_cuit || '',
      alias: raw.alias || '',
      cbu_cvu: raw.cbu_cvu || raw.cbu || '',
    } as TiendaConfig;
  }
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      const [resConfig, resCats, resProds] = await Promise.all([
        supabase.from('tienda_config').select('*').eq('id', 'store').maybeSingle(),
        supabase.from('categorias').select('*').order('orden', { ascending: true }),
        supabase.from('productos').select('*').order('created_at', { ascending: false }),
      ]);

      if (resConfig.data) setConfig(normalizeTiendaConfig(resConfig.data));
      if (resCats.data) setCategories((resCats.data as Categoria[]).filter((item) => item.activa));
      if (resProds.data) setProducts((resProds.data as Producto[]).filter((item) => item.disponible));
    };

    void loadAllData();

    const channel = supabase.channel('public:all');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'tienda_config', filter: 'id=eq.store' }, (payload) => {
      if (payload.new) {
        setConfig(normalizeTiendaConfig(payload.new));
      }
    });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => {
      void supabase.from('categorias').select('*').order('orden', { ascending: true }).then((result) => {
        if (result.data) setCategories((result.data as Categoria[]).filter((item) => item.activa));
      });
    });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
      void supabase.from('productos').select('*').order('created_at', { ascending: false }).then((result) => {
        if (result.data) setProducts((result.data as Producto[]).filter((item) => item.disponible));
      });
    });

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return products.filter((producto) => {
      const matchesCategory = selectedCategory === 'all' || producto.categoria_id === selectedCategory;
      const matchesSearch = !normalized || producto.nombre.toLowerCase().includes(normalized) || producto.descripcion.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === producto.id);
      if (existing) return prev.map((item) => (item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
    });
    toast.success('Producto agregado al carrito 🛒');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item];
        const nextQuantity = item.cantidad + delta;
        return nextQuantity > 0 ? [{ ...item, cantidad: nextQuantity }] : [];
      })
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const envio = subtotal > 0 ? (deliveryMethod === 'delivery' ? 1500 : 0) : 0;
  const total = subtotal + envio;

  const copyValue = async (value: string, field: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(field === 'alias' ? 'Alias copiado al portapapeles 📋' : 'CBU copiado al portapapeles 📋');
      window.setTimeout(() => setCopiedField(null), 1200);
    } catch {
      setStatus('No se pudo copiar el dato.');
    }
  };

  const sanitizeWhatsAppPhone = (phoneRaw: string) => {
    let cleanPhone = phoneRaw.replace(/\D/g, '');
    if (!cleanPhone) return '';
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('15')) cleanPhone = `11${cleanPhone.substring(2)}`;
    if (!cleanPhone.startsWith('549') && cleanPhone.length >= 10) {
      cleanPhone = `549${cleanPhone}`;
    }
    return cleanPhone;
  };

  const handleEnviarWhatsApp = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!cart || cart.length === 0) {
        alert('El carrito está vacío.');
        return;
      }

      const num = sanitizeWhatsAppPhone(config?.telefono || '');
      if (!num) {
        alert('Atención: El comercio no tiene un número de WhatsApp cargado en la configuración.');
        return;
      }

      try {
        await supabase.from('pedidos').insert([
          {
            contenido: cart,
            total,
            estado: 'pendiente',
          },
        ]);
      } catch (dbErr) {
        console.warn('No se pudo registrar el pedido en BD, pero se procederá a enviar WhatsApp:', dbErr);
      }

      const detalle = (cart || []).map((item) => `• ${item.cantidad}x ${item.nombre} ($${item.precio * item.cantidad})`).join('\n');
      const mensaje = `*NUEVO PEDIDO*\n\n${detalle}\n\n*Total:* $${total}`;
      const waUrl = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(mensaje)}`;
      window.location.href = waUrl;
    } catch (error) {
      console.error('Error al procesar el envío de WhatsApp:', error);
      alert('Ocurrió un error al abrir WhatsApp. Revisa la consola.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleEnviarWhatsApp();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-3 sm:px-6 lg:items-center lg:justify-center lg:py-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-cyan-950/70 bg-[#07111f] shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_30px_80px_rgba(2,6,23,0.7)] lg:min-h-[900px]">
          <div className="relative">
            {config?.portada_url ? <img src={config.portada_url} alt="Portada" className="h-56 w-full object-cover" /> : <div className="h-56 w-full bg-gradient-to-br from-cyan-600/40 via-slate-900 to-amber-500/20" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent" />
            <div className="absolute left-1/2 top-[140px] flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-4 border-cyan-400/70 bg-slate-900 shadow-lg shadow-cyan-500/20">
              {config?.logo_url ? <img src={config.logo_url} alt="Logo" className="h-full w-full rounded-full object-cover" /> : <div className="text-3xl font-semibold text-cyan-300">LF</div>}
            </div>
          </div>

          <div className="px-4 pb-24 pt-14 sm:px-6">
            <div className="grid gap-6 xl:grid-cols-[72%_28%]">
              <section className="space-y-6">
                <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/20">
                  <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
                    <div className="flex items-center gap-2 text-amber-400">
                      {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </div>
                    <div>
                      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{config?.nombre || 'Lo de Fiore'}</h1>
                      <p className="mt-2 text-sm text-slate-400 sm:text-base">{config?.subtitulo || config?.descripcion || 'Rotisería y Comidas'}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-900/70 bg-slate-800/80 px-4 py-3 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 text-cyan-400" />
                      <span>{config?.direccion || 'Río Dulce 657, Florencio Varela'}</span>
                    </div>
                  </div>
                </div>

                {status ? <div className="rounded-2xl border border-cyan-900/70 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{status}</div> : null}

                <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-4 shadow-sm shadow-slate-950/10">
                  <label className="flex items-center gap-3 rounded-full border border-slate-700 bg-[#030712] px-4 py-3">
                    <Search className="h-5 w-5 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto por nombre..." className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-1">
                    <button onClick={() => setSelectedCategory('all')} className={`rounded-full px-4 py-2 text-sm ${selectedCategory === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>Todo</button>
                    {categories.map((category) => (
                      <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`rounded-full px-4 py-2 text-sm whitespace-nowrap ${selectedCategory === category.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{category.nombre}</button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-800 bg-[#0b1220] p-4 shadow-sm shadow-slate-950/10">
<div className="mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Menú</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Elige tus favoritos</h2>
                      </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(filteredProducts || []).map((producto) => (
                      <article key={producto.id} className="group overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-4 transition hover:-translate-y-0.5 hover:border-cyan-500/60">
                        <div className="relative overflow-hidden rounded-3xl bg-slate-900">
                          {producto.imagen_url ? (
                            <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              className="h-40 w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27250%27%3E%3Crect width=%27400%27 height=%27250%27 fill=%27%23222%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2720%27 fill=%27%23aaa%27%3ESin imagen%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="flex h-40 w-full items-center justify-center bg-slate-800 text-sm text-slate-500">Sin imagen</div>
                          )}
                          <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-950 shadow-sm shadow-amber-500/30">{formatCurrency(producto.precio)}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{producto.nombre}</h3>
                            <p className="mt-1 text-sm text-slate-400">{producto.descripcion}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">{categories.find((cat) => cat.id === producto.categoria_id)?.nombre || 'General'}</span>
                            <button onClick={() => addToCart(producto)} className="ml-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-400 text-2xl font-semibold text-slate-950 transition hover:bg-amber-300 sm:h-14 sm:w-14">
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="hidden md:block">
                <div className="sticky top-6 space-y-4">
                  <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Pedido en vivo</p>
                    <h2 className="mt-3 text-xl font-semibold text-white">Carrito</h2>
                    <div className="mt-4 space-y-3">
                      {(cart || []).length ? (cart || []).map((item) => (
                        <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{item.nombre}</p>
                              <p className="mt-1 text-sm text-slate-400">{item.cantidad} × {formatCurrency(item.precio)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => updateQuantity(item.id, -1)} className="h-11 w-11 rounded-3xl bg-slate-800 text-lg font-semibold text-slate-200">−</button>
                              <button onClick={() => updateQuantity(item.id, 1)} className="h-11 w-11 rounded-3xl bg-slate-800 text-lg font-semibold text-slate-200">+</button>
                            </div>
                          </div>
                        </div>
                      )) : <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-400">Tu carrito está vacío. Agrega productos para comenzar.</div>}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/10">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                      <div className="flex items-center justify-between text-sm text-slate-400"><span>Envío</span><span>{formatCurrency(envio)}</span></div>
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-base font-semibold text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="mt-4 w-full rounded-3xl bg-amber-400 px-4 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/20">Ver checkout</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {cart.length > 0 ? (
            <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 sm:px-6">
              <button onClick={() => setIsCartOpen(true)} className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-3xl border border-cyan-500/30 bg-[#0f172a]/95 px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(56,189,248,0.12)] backdrop-blur">
                <span>🛒 {cart.reduce((sum, item) => sum + item.cantidad, 0)} items</span>
                <span>Total: {formatCurrency(total)}</span>
                <span className="font-semibold text-cyan-300">👉 Ver mi pedido</span>
              </button>
            </div>
          ) : null}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-[#050816]/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
              <button className="flex flex-1 flex-col items-center gap-1 text-sm text-cyan-400"><Home className="h-5 w-5" />Menú</button>
              <button onClick={() => setIsCartOpen(true)} className="flex flex-1 flex-col items-center gap-1 text-sm text-slate-300">
                <ShoppingBag className="h-5 w-5" />Carrito
                {cart.length ? <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-slate-950">{cart.reduce((sum, item) => sum + item.cantidad, 0)}</span> : null}
              </button>
              <button className="flex flex-1 flex-col items-center gap-1 text-sm text-slate-300"><User className="h-5 w-5" />Ingresar</button>
            </div>
          </div>

          {isCartOpen ? (
            <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
              <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-4 shadow-2xl touch-pan-y">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-cyan-300">Tu pedido</p>
                        <h2 className="text-xl font-semibold text-white">Resumen y checkout</h2>
                      </div>
                      <button onClick={() => setIsCartOpen(false)} className="rounded-full border border-slate-700 p-2 text-slate-300">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {cart.length ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {(cart || []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/70 px-4 py-4">
                              <div>
                                <p className="font-semibold text-white">{item.nombre}</p>
                                <p className="mt-1 text-sm text-slate-400">{item.cantidad} × {formatCurrency(item.precio)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(item.id, -1)} className="h-12 w-12 rounded-3xl bg-slate-800 text-2xl font-semibold text-slate-300">−</button>
                                <span className="min-w-[32px] text-center text-sm font-semibold text-white">{item.cantidad}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="h-12 w-12 rounded-3xl bg-slate-800 text-2xl font-semibold text-slate-300">+</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <button onClick={() => setDeliveryMethod('delivery')} className={`flex w-full items-center justify-center gap-2 rounded-3xl px-4 py-4 text-sm ${deliveryMethod === 'delivery' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                              <Truck className="h-5 w-5" /> Delivery
                            </button>
                            <button onClick={() => setDeliveryMethod('retiro')} className={`flex w-full items-center justify-center gap-2 rounded-3xl px-4 py-4 text-sm ${deliveryMethod === 'retiro' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                              <Store className="h-5 w-5" /> Retiro
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <button onClick={() => setPaymentMethod('efectivo')} className={`flex w-full items-center justify-center gap-2 rounded-3xl px-4 py-4 text-sm ${paymentMethod === 'efectivo' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                              <Banknote className="h-5 w-5" /> Efectivo
                            </button>
                            <button onClick={() => setPaymentMethod('transferencia')} className={`flex w-full items-center justify-center gap-2 rounded-3xl px-4 py-4 text-sm ${paymentMethod === 'transferencia' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                              <CreditCard className="h-5 w-5" /> Transferencia
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input value={cliente} onChange={(e) => setCliente(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm outline-none" placeholder="Tu nombre" />
                            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm outline-none" placeholder="Teléfono" />
                          </div>
                          {deliveryMethod === 'delivery' ? <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm outline-none" placeholder="Dirección de entrega" /> : null}
                          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm outline-none" placeholder="Notas del pedido" rows={4} />

                          {paymentMethod === 'transferencia' ? (
                            <div className="rounded-3xl border border-cyan-900/70 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                              <p className="font-semibold">Datos para transferir</p>
                              <div className="mt-3 space-y-3">
                                {config?.banco ? <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2"><span>Banco</span><span className="font-medium">{config.banco}</span></div> : null}
                                {config?.titular_nombre ? <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2"><span>Titular</span><span className="font-medium">{config.titular_nombre}</span></div> : null}
                                {config?.alias ? <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2"><span>Alias</span><div className="flex items-center gap-2"><span className="font-medium">{config.alias}</span><button type="button" onClick={() => void copyValue(config.alias || '', 'alias')} className="rounded-full border border-slate-700 p-1.5"><Copy className="h-3.5 w-3.5" /></button></div></div> : null}
                                {config?.cbu_cvu ? <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2"><span>CBU / CVU</span><div className="flex items-center gap-2"><span className="font-medium">{config.cbu_cvu}</span><button type="button" onClick={() => void copyValue(config.cbu_cvu || '', 'cbu')} className="rounded-full border border-slate-700 p-1.5"><Copy className="h-3.5 w-3.5" /></button></div></div> : null}
                              </div>
                              {copiedField ? <p className="mt-2 text-xs text-cyan-300">Copiado al portapapeles</p> : null}
                            </div>
                          ) : null}

                          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center justify-between text-sm text-slate-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="mt-3 flex items-center justify-between text-sm text-slate-400"><span>Envío</span><span>{formatCurrency(envio)}</span></div>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-base font-semibold text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
                          </div>

                          <button type="button" disabled={submitting} onClick={() => void handleEnviarWhatsApp()} className="w-full rounded-3xl bg-amber-400 px-5 py-4 text-base font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
                            {submitting ? 'Procesando...' : 'Enviar pedido por WhatsApp 📲'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                        Tu carrito está vacío. Elegí algunos productos para comenzar.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
