import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, ChevronDown, ChevronUp, CircleDollarSign, ClipboardList, ImageIcon, Landmark, Loader2, PackageCheck, Sparkles, Truck, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosService } from '../services/pedidos.service';
import { uploadImage } from '../lib/uploadImage';
import { supabase } from '../lib/supabase';
import type { Categoria, EstadoPedido, Pedido, Producto, Repartidor, TiendaConfig } from '../types/delivery';

const statusLabel: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const initialConfig: TiendaConfig = {
  id: 'store',
  nombre: 'Lo de Fiore',
  descripcion: 'Rotisería y Comidas',
  subtitulo: 'Rotisería y Comidas',
  direccion: 'Río Dulce 657, Florencio Varela',
  telefono: '1122334455',
  banco: 'Santander',
  titular_nombre: 'Lo de Fiore SRL',
  titular_cuit: '30-12345678-9',
  alias: 'lodefiore.mercadopago',
  cbu_cvu: '0000003100000000000000',
};

function normalizeTiendaConfig(raw: any): TiendaConfig {
  if (!raw) return initialConfig;
  return {
    id: raw.id || 'store',
    nombre: raw.nombre || raw.nombre_tienda || raw.nombre_tienda || '',
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

const metricCards = [
  { title: 'Ventas hoy', icon: CircleDollarSign },
  { title: 'Pedidos', icon: ClipboardList },
  { title: 'Ticket promedio', icon: Wallet },
];

type ProductFormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  categoria_id: string;
  imagen_url: string;
  disponible: boolean;
};

type ProductSectionProps = {
  categories: Categoria[];
  products: Producto[];
  filteredProducts: Producto[];
  search: string;
  selectedCategory: string;
  setSearch: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  newProduct: ProductFormState;
  setNewProduct: React.Dispatch<React.SetStateAction<ProductFormState>>;
  editingProduct: Partial<Producto> | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<Partial<Producto> | null>>;
  editingProductId: string | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  currentProductImage: string | null;
  setCurrentProductImage: React.Dispatch<React.SetStateAction<string | null>>;
  editingProductFile: File | null;
  setEditingProductFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleSaveProducto: (e?: React.FormEvent) => Promise<void>;
  handleDeleteProduct: (id: string) => Promise<void>;
  handleToggleProduct: (product: Producto, value: boolean) => Promise<void>;
  handleUpload: (field: 'logo_url' | 'portada_url' | 'imagen_url', file: File | null) => Promise<void>;
  uploadingField: string | null;
  handleNuevoProductoBtn: () => void;
};

function ProductSection({
  categories,
  products,
  filteredProducts,
  search,
  selectedCategory,
  setSearch,
  setSelectedCategory,
  newProduct,
  setNewProduct,
  editingProduct,
  setEditingProduct,
  editingProductId,
  setEditingProductId,
  currentProductImage,
  setCurrentProductImage,
  editingProductFile,
  setEditingProductFile,
  handleSaveProducto,
  handleDeleteProduct,
  handleToggleProduct,
  handleUpload,
  uploadingField,
  handleNuevoProductoBtn,
}: ProductSectionProps) {
  const isEditing = Boolean(editingProductId || editingProduct?.id);
  const formTitle = isEditing ? 'Editar producto' : 'Nuevo producto';
  const activeProduct = isEditing
    ? ({ ...newProduct, ...editingProduct } as ProductFormState & Partial<Producto>)
    : newProduct;
  type ActiveProductChange = Partial<ProductFormState> | Partial<Producto>;
  const updateActiveProduct = (changes: ActiveProductChange) => {
    if (isEditing) {
      setEditingProduct((prev: Partial<Producto> | null) => ({ ...(prev || {}), ...(changes as Partial<Producto>) } as Partial<Producto>));
    } else {
      setNewProduct((prev: ProductFormState) => ({ ...prev, ...(changes as Partial<ProductFormState>) }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Gestión de productos</h2>
            <p className="mt-1 text-sm text-slate-400">Crea, edita y administra tus productos de forma rápida.</p>
          </div>
          <button onClick={handleNuevoProductoBtn} className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
            + Nuevo Producto
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none sm:w-[65%]"
              placeholder="Buscar producto..."
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none sm:w-[30%]"
            >
              <option value="all">Todas las categorías</option>
              <option value="orphan">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.nombre}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-400">No hay productos para mostrar.</div>
            ) : (
              filteredProducts.map((product) => {
                const categoryName = categories.find((category) => category.id === product.categoria_id)?.nombre || 'Sin categoría';
                return (
                  <div key={product.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-800">
                          {product.imagen_url ? (
                            <img src={product.imagen_url} alt={product.nombre} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs uppercase text-slate-500">Sin imagen</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{product.nombre}</p>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{product.descripcion || 'Sin descripción'}</p>
                          <div className="mt-2 inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                            {categoryName}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-right sm:items-end">
                        <span className="text-sm font-semibold text-amber-400">{formatCurrency(product.precio)}</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void handleToggleProduct(product, !product.disponible)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${product.disponible ? 'bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/20' : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'}`}>
                            {product.disponible ? '✅ Disponible' : '🚫 Sin stock'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingProductId(product.id);
                              setEditingProduct(product);
                              setCurrentProductImage(product.imagen_url || null);
                              setEditingProductFile(null);
                            }}
                            className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => void handleDeleteProduct(product.id)}
                            className="rounded-full bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">{formTitle}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{isEditing ? 'Editá el producto seleccionado' : 'Crea un nuevo producto'}</h3>
            </div>
            {isEditing ? (
              <button onClick={handleNuevoProductoBtn} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-700">
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={activeProduct.nombre}
              onChange={(e) => updateActiveProduct({ nombre: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none"
              placeholder="Nombre"
            />
            <input
              value={activeProduct.precio?.toString() || ''}
              onChange={(e) => updateActiveProduct({ precio: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none"
              placeholder="Precio"
            />
            <textarea
              value={activeProduct.descripcion}
              onChange={(e) => updateActiveProduct({ descripcion: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none"
              placeholder="Descripción"
            />
            <select
              value={activeProduct.categoria_id}
              onChange={(e) => updateActiveProduct({ categoria_id: e.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none"
            >
              <option value="">Seleccioná categoría</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            <label className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300">
              <span className="mb-2 block text-slate-400">Foto del producto</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (currentProductImage?.startsWith('blob:')) {
                    URL.revokeObjectURL(currentProductImage);
                  }
                  setEditingProductFile(file);
                  setCurrentProductImage(URL.createObjectURL(file));
                }}
                className="w-full text-slate-300"
              />
              {editingProductFile ? <div className="mt-2 text-sm text-slate-300">Archivo seleccionado. Se cargará al guardar.</div> : null}
              {(currentProductImage || activeProduct.imagen_url) ? <img src={currentProductImage || activeProduct.imagen_url} alt="Preview producto" className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={Boolean(activeProduct.disponible)}
                onChange={(e) => updateActiveProduct({ disponible: e.target.checked })}
              />
              Disponible
            </label>
            <button
              onClick={(e) => void handleSaveProducto(e)}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              {isEditing ? 'Guardar Cambios' : '+ Crear Producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [orderTab, setOrderTab] = useState<'pendiente' | 'preparando' | 'en_camino' | 'entregado'>('pendiente');
  const [printOrder, setPrintOrder] = useState<Pedido | null>(null);
  const [config, setConfig] = useState<TiendaConfig>(initialConfig);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [pulse, setPulse] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    caja: true,
    comercio: true,
    identidad: true,
    cuentas: true,
    categorias: true,
    productos: true,
    reparto: true,
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newProduct, setNewProduct] = useState({ nombre: '', descripcion: '', precio: '', categoria_id: '', imagen_url: '', disponible: true });
  const [editingProduct, setEditingProduct] = useState<Partial<Producto> | null>(null);
  const [newDriver, setNewDriver] = useState({ nombre: '', telefono: '', estado: 'disponible' as Repartidor['estado'] });
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Partial<Repartidor>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [editingProductFile, setEditingProductFile] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [currentProductImage, setCurrentProductImage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [savingConfigSection, setSavingConfigSection] = useState<'brand' | 'bank' | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const fetchStoreConfig = async () => {
    const { data, error } = await supabase.from('tienda_config').select('*').eq('id', 'store').single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error leyendo tienda_config:', error);
      return;
    }
    if (data) {
      setConfig(normalizeTiendaConfig(data));
    }
  };

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error leyendo productos:', error);
      return;
    }
    console.log('Productos encontrados:', data);
    setProducts(data || []);
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from('categorias').select('*').order('orden', { ascending: true });
    if (error) {
      console.error('Error leyendo categorias:', error);
      return;
    }
    setCategories(data || []);
  };

  const fetchAdminData = async () => {
    const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] = await Promise.all([
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
      supabase.from('productos').select('*, categorias(*)').order('created_at', { ascending: false }),
    ]);

    if (!catErr && catData) {
      setCategories(catData);
    } else if (catErr) {
      console.error('Error leyendo categorias:', catErr);
    }

    if (!prodErr && prodData) {
      setProducts(prodData as Producto[]);
    } else if (prodErr) {
      console.error('Error leyendo productos:', prodErr);
    }
  };

  const loadAllData = async () => {
    const [resConfig, resCats, resProds] = await Promise.all([
      supabase.from('tienda_config').select('*').eq('id', 'store').maybeSingle(),
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
      supabase.from('productos').select('*, categorias(*)').order('created_at', { ascending: false }),
    ]);

    if (resConfig.data) setConfig(normalizeTiendaConfig(resConfig.data));
    if (resCats.data) setCategories(resCats.data as Categoria[]);
    if (resProds.data) setProducts(resProds.data as Producto[]);
  };

  useEffect(() => {
    const load = async () => {
      await loadAllData();
      const [drivers, pedidos] = await Promise.all([pedidosService.getRepartidores(), pedidosService.getPedidos()]);
      setRepartidores(drivers);
      setOrders(pedidos);
    };

    void load();

    const ordersChannel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: ['INSERT', 'UPDATE'], schema: 'public', table: 'pedidos' },
        (payload) => {
          const pedido = payload.new as Pedido;
          if (!pedido) return;

          setOrders((prev) => {
            const exists = prev.find((item) => item.id === pedido.id);
            if (!exists) {
              if (payload.eventType === 'INSERT' && pedido.estado === 'pendiente') {
                playAttentionTone();
                toast.success(`Nuevo pedido recibido: ${pedido.id}`);
              }
              return [pedido, ...prev];
            }
            return prev.map((item) => (item.id === pedido.id ? pedido : item));
          });

          setPulse(true);
          window.setTimeout(() => setPulse(false), 800);
        }
      )
      .subscribe();

    const publicChannel = pedidosService.subscribeToPublicAll({
      storeConfig: (nextConfig) => {
        setConfig(normalizeTiendaConfig(nextConfig));
      },
      categories: () => {
        void fetchAdminData();
      },
      products: () => {
        void fetchAdminData();
      },
    });

    return () => {
      ordersChannel.unsubscribe();
      publicChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !newProduct.categoria_id) {
      setNewProduct((prev) => ({ ...prev, categoria_id: categories[0].id }));
    }
  }, [categories]);

  const playAttentionTone = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.15;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
      oscillator.onended = () => ctx.close();
    } catch {
      // No audio support
    }
  };

  const handlePrintOrder = (order: Pedido) => {
    setPrintOrder(order);
    const afterPrint = async () => {
      window.removeEventListener('afterprint', afterPrint);
      await handleStatusChange(order, 'preparando');
      setPrintOrder(null);
    };
    window.addEventListener('afterprint', afterPrint);
    window.setTimeout(() => window.print(), 100);
  };

  const filteredProducts = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return products.filter((producto) => {
      const matchesCategory = selectedCategory === 'all' || (selectedCategory === 'orphan' ? !producto.categoria_id : producto.categoria_id === selectedCategory);
      const matchesSearch = !normalized || producto.nombre.toLowerCase().includes(normalized) || producto.descripcion.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const ventasHoy = orders.filter((order) => order.estado !== 'cancelado').reduce((sum, order) => sum + order.total, 0);
  const pedidosHoy = orders.filter((order) => order.estado !== 'cancelado').length;
  const ticketPromedio = pedidosHoy ? Math.round(ventasHoy / pedidosHoy) : 0;

  const persistConfig = async (nextConfig: TiendaConfig) => {
    const { data, error } = await supabase.from('tienda_config').upsert(
      {
        id: 'store',
        nombre: nextConfig.nombre,
        descripcion: nextConfig.descripcion,
        subtitulo: nextConfig.subtitulo,
        direccion: nextConfig.direccion,
        telefono: nextConfig.telefono,
        logo_url: nextConfig.logo_url,
        portada_url: nextConfig.portada_url,
        banco: nextConfig.banco,
        titular_nombre: nextConfig.titular_nombre,
        titular_cuit: nextConfig.titular_cuit,
        cbu_cvu: nextConfig.cbu_cvu,
        alias: nextConfig.alias,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error guardando tienda_config:', error);
      throw error;
    }
    return nextConfig;
  };

  const uploadBrandAsset = async (field: 'logo_url' | 'portada_url', file: File | null) => {
    if (!file) return null;
    setUploadingField(field);
    try {
      const publicUrl = await uploadImage(file, 'config');
      setConfig((prev) => ({ ...prev, [field]: publicUrl } as TiendaConfig));
      return publicUrl;
    } finally {
      setUploadingField(null);
    }
  };

  const loadStoreConfigRow = async () => {
    const { data, error } = await supabase.from('tienda_config').select('*').eq('id', 'store').maybeSingle();
    if (error) {
      console.error('Error cargando tienda_config actual:', error);
      return null;
    }
    return data as TiendaConfig | null;
  };

  const handleSaveBrandingConfig = async () => {
    setSavingConfigSection('brand');
    try {
      const currentData = await loadStoreConfigRow();
      let finalLogo = currentData?.logo_url || '';
      let finalPortada = currentData?.portada_url || '';

      if (logoFile) {
        const uploadedLogo = await uploadImage(logoFile, 'config');
        if (uploadedLogo) finalLogo = uploadedLogo;
      }
      if (portadaFile) {
        const uploadedPortada = await uploadImage(portadaFile, 'config');
        if (uploadedPortada) finalPortada = uploadedPortada;
      }

      const nextConfig = {
        ...config,
        logo_url: finalLogo,
        portada_url: finalPortada,
      } as TiendaConfig;
      await persistConfig(nextConfig);
      setConfig(nextConfig);
      setLogoFile(null);
      setPortadaFile(null);
      await loadAllData();
      toast.success('Cambios de identidad guardados con éxito ✅');
    } catch {
      toast.error('No se pudieron guardar los cambios de identidad');
    } finally {
      setSavingConfigSection(null);
    }
  };

  const handleSaveBankConfig = async () => {
    setSavingConfigSection('bank');
    try {
      const currentData = await loadStoreConfigRow();
      let finalLogo = currentData?.logo_url || '';
      let finalPortada = currentData?.portada_url || '';

      if (logoFile) {
        const uploadedLogo = await uploadImage(logoFile, 'config');
        if (uploadedLogo) finalLogo = uploadedLogo;
      }
      if (portadaFile) {
        const uploadedPortada = await uploadImage(portadaFile, 'config');
        if (uploadedPortada) finalPortada = uploadedPortada;
      }

      const nextConfig = {
        ...config,
        logo_url: finalLogo,
        portada_url: finalPortada,
      } as TiendaConfig;
      await persistConfig(nextConfig);
      setConfig(nextConfig);
      setLogoFile(null);
      setPortadaFile(null);
      await loadAllData();
      toast.success('Datos bancarios guardados con éxito ✅');
    } catch {
      toast.error('No se pudieron guardar los datos bancarios');
    } finally {
      setSavingConfigSection(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    await pedidosService.createCategory({ nombre: newCategory.trim(), orden: categories.length + 1, activa: true });
    setNewCategory('');
    await fetchAdminData();
  };

  const handleUpdateCategory = async (id: string, nombre: string) => {
    if (!nombre.trim()) return;
    await pedidosService.updateCategory(id, { nombre: nombre.trim() });
    setEditingCategoryId(null);
    setEditingCategoryName('');
    await fetchAdminData();
  };

  const handleDeleteCategory = async (id: string) => {
    await pedidosService.deleteCategory(id);
    await fetchAdminData();
  };

  const handleCreateProduct = async () => {
    if (!newProduct.nombre.trim() || !newProduct.precio || !newProduct.categoria_id) {
      toast.error('Completá nombre, precio y categoría para crear el producto');
      return;
    }

    const precio = Number(newProduct.precio);
    if (Number.isNaN(precio)) {
      toast.error('El precio debe ser un número válido');
      return;
    }

    try {
      setCreatingProduct(true);
      await pedidosService.createProduct({
        nombre: newProduct.nombre.trim(),
        descripcion: newProduct.descripcion,
        precio,
        categoria_id: newProduct.categoria_id,
        imagen_url: newProduct.imagen_url || null,
        disponible: newProduct.disponible,
      });
      setNewProduct({ nombre: '', descripcion: '', precio: '', categoria_id: categories[0]?.id || '', imagen_url: '', disponible: true });
      await fetchAdminData();
      toast.success('Producto creado con éxito ✅');
    } catch {
      toast.error('No se pudo crear el producto');
    } finally {
      setCreatingProduct(false);
    }
  };

  const resetFormulario = () => {
    setNewProduct({ nombre: '', descripcion: '', precio: '', categoria_id: categories[0]?.id || '', imagen_url: '', disponible: true });
    setEditingProduct(null);
    setEditingProductId(null);
    setEditingProductFile(null);
    if (currentProductImage?.startsWith('blob:')) {
      URL.revokeObjectURL(currentProductImage);
    }
    setCurrentProductImage(null);
  };

  const handleNuevoProductoBtn = () => {
    resetFormulario();
  };

  const handleUpdateProduct = async (id: string) => {
    if (!editingProduct) {
      toast.error('No hay producto seleccionado para editar');
      return;
    }
    if (!editingProduct.nombre || !String(editingProduct.nombre).trim()) {
      toast.error('Completá el nombre del producto');
      return;
    }
    if (!editingProduct.categoria_id) {
      toast.error('Seleccioná una categoría');
      return;
    }

    const precioNum = Number(editingProduct.precio);
    if (!Number.isFinite(precioNum)) {
      toast.error('El precio debe ser un número válido');
      return;
    }

    const updates: Partial<Producto> = {
      nombre: String(editingProduct.nombre).trim(),
      descripcion: editingProduct.descripcion,
      precio: precioNum,
      categoria_id: editingProduct.categoria_id,
      disponible: Boolean(editingProduct.disponible),
      updated_at: new Date().toISOString(),
    };

    if (editingProductFile) {
      setUploadingField('imagen_url');
      try {
        const publicUrl = await uploadImage(editingProductFile, 'productos');
        if (!publicUrl) {
          toast.error('No se pudo subir la nueva imagen');
          return;
        }
        updates.imagen_url = publicUrl;
      } catch (error) {
        console.error('Error subiendo imagen de producto:', error);
        toast.error('No se pudo subir la nueva imagen');
        return;
      } finally {
        setUploadingField(null);
      }
      setEditingProductFile(null);
    } else {
      updates.imagen_url = editingProduct.imagen_url || null;
    }

    try {
      const { error } = await supabase.from('productos').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Producto actualizado con éxito ✅');
      setEditingProduct(null);
      await fetchAdminData();
    } catch (err) {
      console.error('Error actualizando producto:', err);
      toast.error('No se pudo actualizar el producto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await pedidosService.deleteProduct(id);
    await fetchAdminData();
  };

  const handleSaveProducto = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const isEditingLocal = Boolean(editingProductId);
    const active = isEditingLocal ? ({ ...newProduct, ...editingProduct } as ProductFormState & Partial<Producto>) : newProduct;

    if (!active.nombre || !String(active.nombre).trim()) {
      toast.error('Completá el nombre del producto');
      return;
    }
    if (!active.categoria_id) {
      toast.error('Seleccioná una categoría');
      return;
    }
    const precioNum = Number(active.precio);
    if (!Number.isFinite(precioNum)) {
      toast.error('El precio debe ser un número válido');
      return;
    }

    let imageUrl = currentProductImage || active.imagen_url || null;
    if (editingProductFile) {
      setUploadingField('imagen_url');
      try {
        const fileExt = editingProductFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `productos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, editingProductFile, { upsert: true });

        if (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          toast.error('Error al subir la nueva imagen.');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error('Error subiendo imagen:', err);
        toast.error('No se pudo subir la imagen');
        return;
      } finally {
        setUploadingField(null);
      }
    }

    const payload: Partial<Producto> = {
      nombre: String(active.nombre).trim(),
      descripcion: active.descripcion || undefined,
      precio: precioNum,
      categoria_id: active.categoria_id || undefined,
      imagen_url: imageUrl,
      disponible: Boolean(active.disponible),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEditingLocal && editingProductId) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editingProductId);
        if (error) throw error;
        toast.success('Producto actualizado con éxito ✅');
      } else {
        const { error } = await supabase.from('productos').insert([payload]);
        if (error) throw error;
        toast.success('Producto creado con éxito ✅');
      }
      resetFormulario();
      setEditingProductFile(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Error guardando producto:', err);
      toast.error(`No se pudo guardar el producto: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleToggleProduct = async (product: Producto, value: boolean) => {
    await pedidosService.updateProduct(product.id, { disponible: value });
    setProducts(await pedidosService.getProducts());
  };

  const handleCreateDriver = async () => {
    if (!newDriver.nombre) return;
    await pedidosService.createRepartidor({ nombre: newDriver.nombre, telefono: newDriver.telefono, estado: newDriver.estado });
    setNewDriver({ nombre: '', telefono: '', estado: 'disponible' });
    setRepartidores(await pedidosService.getRepartidores());
  };

  const handleUpdateDriver = async (id: string) => {
    if (!editingDriver.nombre) return;
    await pedidosService.updateRepartidor(id, { nombre: editingDriver.nombre, telefono: editingDriver.telefono, estado: editingDriver.estado });
    setEditingDriverId(null);
    setEditingDriver({});
    setRepartidores(await pedidosService.getRepartidores());
  };

  const handleDeleteDriver = async (id: string) => {
    await pedidosService.deleteRepartidor(id);
    setRepartidores(await pedidosService.getRepartidores());
  };

  const handleUpload = async (field: 'logo_url' | 'portada_url' | 'imagen_url', file: File | null) => {
    if (!file) return;
    if (field === 'imagen_url') {
      setUploadingField(field);
      try {
        const publicUrl = await uploadImage(file, 'imagenes');
        if (!publicUrl) {
          toast.error('No se pudo subir la imagen');
          return;
        }
        if (editingProduct?.id) {
          setEditingProduct((prev) => ({ ...prev, imagen_url: publicUrl } as Partial<Producto>));
        } else {
          setNewProduct((prev) => ({ ...prev, imagen_url: publicUrl }));
        }
        toast.success('Imagen lista para guardar ✅');
      } catch {
        toast.error('No se pudo subir la imagen');
      } finally {
        setUploadingField(null);
      }
      return;
    }

    if (field === 'logo_url') {
      setLogoFile(file);
    } else if (field === 'portada_url') {
      setPortadaFile(file);
    }

    const previewUrl = URL.createObjectURL(file);
    setConfig((prev) => ({ ...prev, [field]: previewUrl } as TiendaConfig));
    toast.success('Archivo seleccionado. Guardá para subirlo al guardar identidad.');
  };

  const handleStatusChange = async (order: Pedido, next: EstadoPedido) => {
    await pedidosService.updatePedido(order.id, { estado: next, updated_at: new Date().toISOString() });
  };

  const handleAssignDriver = async (order: Pedido, repartidorId: string) => {
    await pedidosService.updatePedido(order.id, { repartidor_id: repartidorId, updated_at: new Date().toISOString() });
  };

  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 80mm; padding: 12px; font-family: 'Courier New', Courier, monospace; background: white; color: black; }
          .print-only .ticket { margin-bottom: 12px; }
          .print-only .cut-line { border-top: 1px dashed #000; margin: 12px 0; }
          .print-only p, .print-only span { font-size: 12px; }
          .print-only h2 { font-size: 14px; margin-bottom: 8px; }
        }
      `}</style>
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:px-8">
        {printOrder ? (
          <div className="print-only">
            <div className="ticket">
              <h2>Ticket 1 - Caja / Cocina</h2>
              <p>Pedido #{printOrder.id}</p>
              <p>Cliente: {printOrder.cliente_nombre}</p>
              <p>Dirección: {printOrder.cliente_direccion}</p>
              <p>Teléfono: {printOrder.cliente_telefono || 'No cargado'}</p>
              <p>Método pago: {printOrder.metodo_pago || 'N/A'}</p>
              <div className="mt-2">
                {printOrder.productos.map((producto, index) => (
                  <p key={`ticket1-${index}`}>{producto.cantidad}x {producto.nombre} - {formatCurrency(producto.precio * producto.cantidad)}</p>
                ))}
              </div>
              <div className="mt-2">
                <p>Total: {formatCurrency(printOrder.total)}</p>
                <p>Envío: {formatCurrency(printOrder.envio)}</p>
                <p>Subtotal: {formatCurrency(printOrder.subtotal)}</p>
              </div>
            </div>
            <div className="cut-line" />
            <div className="ticket">
              <h2>Ticket 2 - Delivery / Empaque</h2>
              <p>Cliente: {printOrder.cliente_nombre}</p>
              <p>Dirección: {printOrder.cliente_direccion}</p>
              <p>Teléfono: {printOrder.cliente_telefono || 'No cargado'}</p>
              <p>Monto a cobrar: {formatCurrency(printOrder.total)}</p>
              <div className="mt-2">
                <p className="uppercase tracking-[0.18em] text-xs">Productos</p>
                {printOrder.productos.map((producto, index) => (
                  <p key={`ticket2-${index}`}>[ ] {producto.cantidad}x {producto.nombre}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="rounded-[32px] border border-cyan-950/70 bg-[#07111f] p-4 shadow-[0_20px_80px_rgba(2,6,23,0.6)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Panel de administración</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Lo de Fiore • Centro de control</h1>
            </div>
            <div className={`flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 ${pulse ? 'bg-amber-500/10' : 'bg-slate-900'}`}>
              <BellRing className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-300">Actualización en vivo</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {metricCards.map((card) => {
              const Icon = card.icon;
              const value = card.title === 'Ventas hoy' ? formatCurrency(ventasHoy) : card.title === 'Pedidos' ? pedidosHoy : formatCurrency(ticketPromedio);
              return (
                <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 text-cyan-400"><Icon className="h-4 w-4" /><span className="text-sm">{card.title}</span></div>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            {[
              { key: 'caja', title: '🧾 Panel de comandas', icon: CircleDollarSign, content: <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(['pendiente', 'preparando', 'en_camino', 'entregado'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setOrderTab(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${orderTab === tab ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      >
                        {tab === 'pendiente' ? 'Pendientes' : tab === 'preparando' ? 'En preparación' : tab === 'en_camino' ? 'En camino' : 'Historial'}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {(orders.filter((order) => {
                      if (orderTab === 'pendiente') return order.estado === 'pendiente';
                      if (orderTab === 'preparando') return order.estado === 'preparando';
                      if (orderTab === 'en_camino') return order.estado === 'en_camino';
                      return order.estado === 'entregado';
                    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []).map((order) => (
                      <div key={order.id} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-sm shadow-slate-950/10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">Pedido #{order.id}</p>
                            <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">{statusLabel[order.estado]}</span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1 text-sm text-slate-300">
                            <p><span className="font-semibold text-white">Cliente:</span> {order.cliente_nombre}</p>
                            <p><span className="font-semibold text-white">Dirección:</span> {order.cliente_direccion}</p>
                            <p><span className="font-semibold text-white">Teléfono:</span> {order.cliente_telefono || 'No cargado'}</p>
                          </div>
                          <div className="space-y-1 text-sm text-slate-300">
                            <p><span className="font-semibold text-white">Pago:</span> {order.metodo_pago || 'N/A'}</p>
                            <p><span className="font-semibold text-white">Entrega:</span> {order.metodo_entrega || 'N/A'}</p>
                            <p><span className="font-semibold text-white">Total:</span> {formatCurrency(order.total)}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Detalle de ítems</p>
                          <div className="mt-2 space-y-1">
                            {order.productos.map((producto, index) => (
                              <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-2">
                                <span>{producto.cantidad}x {producto.nombre}</span>
                                <span>{formatCurrency(producto.precio * producto.cantidad)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {order.estado === 'pendiente' ? (
                            <button type="button" onClick={() => handlePrintOrder(order)} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">🖨️ Imprimir y Cocinar</button>
                          ) : null}
                          {order.estado === 'preparando' ? (
                            <button type="button" onClick={() => void handleStatusChange(order, 'en_camino')} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">🛵 Enviar con Delivery</button>
                          ) : null}
                          {order.estado === 'en_camino' ? (
                            <span className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">En camino</span>
                          ) : null}
                          {order.estado === 'entregado' ? (
                            <span className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300">Completado</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {orders.filter((order) => {
                      if (orderTab === 'pendiente') return order.estado === 'pendiente';
                      if (orderTab === 'preparando') return order.estado === 'preparando';
                      if (orderTab === 'en_camino') return order.estado === 'en_camino';
                      return order.estado === 'entregado';
                    }).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-400">No hay comandas en esta vista.</div>
                    ) : null}
                  </div>
                </div> },
              { key: 'comercio', title: '👤 Información del comercio', icon: UserRound, content: <div className="grid gap-3 md:grid-cols-2"><div className="space-y-3"><input value={config.nombre} onChange={(e) => setConfig({ ...config, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Nombre" /><textarea value={config.descripcion || ''} onChange={(e) => setConfig({ ...config, descripcion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Descripción" /><input value={config.subtitulo || ''} onChange={(e) => setConfig({ ...config, subtitulo: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Subtítulo / categoría" /><input value={config.direccion || ''} onChange={(e) => setConfig({ ...config, direccion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Dirección" /><input value={config.telefono || ''} onChange={(e) => setConfig({ ...config, telefono: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Teléfono" /><button onClick={() => void handleSaveBrandingConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'brand' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Actualizá la identidad del comercio para que quede visible en la tienda y en la vista de delivery.</div></div> },
              { key: 'identidad', title: '📸 Identidad visual e imágenes', icon: ImageIcon, content: <div className="grid gap-3 md:grid-cols-2"><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Logo del comercio</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('logo_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'logo_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.logo_url ? <img src={config.logo_url} alt="Preview logo" className="mt-3 h-20 w-full rounded-2xl object-cover" /> : null}</label><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Portada</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('portada_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'portada_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.portada_url ? <img src={config.portada_url} alt="Preview portada" className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}</label><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Subí imágenes reales desde tu computadora. Se actualizarán automáticamente en la tienda y en la vista de delivery.</div></div> },
              { key: 'cuentas', title: '💳 Cuentas de transferencia', icon: Landmark, content: <div className="grid gap-3 md:grid-cols-2"><input value={config.banco || ''} onChange={(e) => setConfig({ ...config, banco: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Banco" /><input value={config.titular_nombre || ''} onChange={(e) => setConfig({ ...config, titular_nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Titular" /><input value={config.titular_cuit || ''} onChange={(e) => setConfig({ ...config, titular_cuit: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CUIT / CUIL" /><input value={config.alias || ''} onChange={(e) => setConfig({ ...config, alias: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Alias" /><input value={config.cbu_cvu || ''} onChange={(e) => setConfig({ ...config, cbu_cvu: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CBU / CVU" /><button onClick={() => void handleSaveBankConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'bank' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div> },
              { key: 'categorias', title: '📚 Estructura de secciones (categorías)', icon: PackageCheck, content: <div className="space-y-3"><div className="flex gap-2"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Agregar categoría" /><button onClick={handleCreateCategory} className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">Agregar</button></div><div className="space-y-2">{categories.map((category, index) => <div key={category.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm"><div className="flex items-center gap-2"><span>{['🍕','🥟','🍔'][index % 3]}</span><span>{category.nombre}</span></div><div className="flex gap-2"><button onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.nombre); }} className="rounded-full bg-slate-800 px-3 py-1 text-xs">Editar</button><button onClick={() => { void handleDeleteCategory(category.id); }} className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-300">Eliminar</button></div></div>)}</div>{editingCategoryId ? <div className="flex gap-2"><input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" /><button onClick={() => { void handleUpdateCategory(editingCategoryId, editingCategoryName); }} className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">Guardar</button></div> : null}</div> },
              { key: 'productos', title: '🛍️ Gestión de productos', icon: Sparkles, content: <ProductSection categories={categories} products={products} filteredProducts={filteredProducts} search={search} selectedCategory={selectedCategory} setSearch={setSearch} setSelectedCategory={setSelectedCategory} newProduct={newProduct} setNewProduct={setNewProduct} editingProduct={editingProduct} setEditingProduct={setEditingProduct} editingProductId={editingProductId} setEditingProductId={setEditingProductId} currentProductImage={currentProductImage} setCurrentProductImage={setCurrentProductImage} editingProductFile={editingProductFile} setEditingProductFile={setEditingProductFile} handleSaveProducto={handleSaveProducto} handleDeleteProduct={handleDeleteProduct} handleToggleProduct={handleToggleProduct} handleUpload={handleUpload} uploadingField={uploadingField} handleNuevoProductoBtn={handleNuevoProductoBtn} /> },
              { key: 'reparto', title: '🛵 Gestión de repartidores y despacho', icon: Truck, content: <div className="space-y-3"><div className="grid gap-3 md:grid-cols-3"><input value={newDriver.nombre} onChange={(e) => setNewDriver({ ...newDriver, nombre: e.target.value })} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Nombre" /><input value={newDriver.telefono} onChange={(e) => setNewDriver({ ...newDriver, telefono: e.target.value })} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Teléfono" /><select value={newDriver.estado} onChange={(e) => setNewDriver({ ...newDriver, estado: e.target.value as Repartidor['estado'] })} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none"><option value="disponible">Disponible</option><option value="ocupado">Ocupado</option><option value="inactivo">Inactivo</option></select></div><button onClick={handleCreateDriver} className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">Agregar repartidor</button><div className="space-y-2">{repartidores.map((driver) => <div key={driver.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-center justify-between"><span>{driver.nombre}</span><span className="text-slate-400">{driver.estado}</span></div>{editingDriverId === driver.id ? <div className="mt-3 space-y-2"><input value={editingDriver.nombre || ''} onChange={(e) => setEditingDriver({ ...editingDriver, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" /><input value={editingDriver.telefono || ''} onChange={(e) => setEditingDriver({ ...editingDriver, telefono: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" /><select value={editingDriver.estado || 'disponible'} onChange={(e) => setEditingDriver({ ...editingDriver, estado: e.target.value as Repartidor['estado'] })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"><option value="disponible">Disponible</option><option value="ocupado">Ocupado</option><option value="inactivo">Inactivo</option></select><button onClick={() => void handleUpdateDriver(driver.id)} className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Guardar</button></div> : <div className="mt-3 flex gap-2"><button onClick={() => { setEditingDriverId(driver.id); setEditingDriver(driver); }} className="rounded-full bg-slate-800 px-3 py-2 text-xs">Editar</button><button onClick={() => { void handleDeleteDriver(driver.id); }} className="rounded-full bg-rose-500/15 px-3 py-2 text-xs text-rose-300">Eliminar</button></div>}</div>)}</div><div className="space-y-2">{orders.filter((order) => order.estado !== 'entregado' && order.estado !== 'cancelado').map((order) => <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium text-white">{order.cliente_nombre}</p><p className="text-xs text-slate-400">{order.cliente_direccion}</p></div><span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{statusLabel[order.estado]}</span></div><div className="mt-3 flex flex-wrap gap-2"><select value={order.repartidor_id || ''} onChange={(e) => { void handleAssignDriver(order, e.target.value); }} className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-sm"><option value="">Asignar repartidor</option>{repartidores.map((driver) => <option key={driver.id} value={driver.id}>{driver.nombre}</option>)}</select><button onClick={() => { void handleStatusChange(order, 'preparando'); }} className="rounded-xl bg-sky-600 px-3 py-2 text-sm text-white">Preparando</button><button onClick={() => { void handleStatusChange(order, 'en_camino'); }} className="rounded-xl bg-violet-600 px-3 py-2 text-sm text-white">En camino</button><button onClick={() => { void handleStatusChange(order, 'entregado'); }} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white">Entregado</button></div></div>)}</div></div> },
            ].map((section) => {
              const Icon = section.icon;
              const isOpen = expanded[section.key];
              return (
                <div key={section.key} className="overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/70">
                  <button onClick={() => toggleSection(section.key)} className="flex w-full items-center justify-between px-4 py-4 text-left text-white">
                    <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-cyan-400" />{section.title}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {isOpen ? <div className="border-t border-slate-800 px-4 py-4">{section.content}</div> : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => void handleSaveBrandingConfig()} className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">Guardar cambios globales</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}
