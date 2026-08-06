import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, ChevronDown, ChevronUp, CircleDollarSign, ClipboardList, ImageIcon, Landmark, Loader2, PackageCheck, Sparkles, Truck, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosService } from '../services/pedidos.service';
import { uploadImage } from '../lib/uploadImage';
import { supabase } from '../lib/supabase';
import KanbanOrders from '../components/admin/KanbanOrders';
import DriverManager from '../components/admin/DriverManager';
import type { Categoria, EstadoPedido, Pedido, Producto, Repartidor, TiendaConfig } from '../types/delivery';

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
  const [isProductsOpen, setIsProductsOpen] = useState(true);
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

          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/80">
            <button
              type="button"
              onClick={() => setIsProductsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              <span>📦 Gestión de Productos ({filteredProducts.length} productos)</span>
              <span>{isProductsOpen ? '▲' : '▼'}</span>
            </button>
            <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${isProductsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="max-h-[600px] overflow-y-auto px-4 pb-4 pt-2">
                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-400">No hay productos para mostrar.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
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
                    })}
                  </div>
                )}
              </div>
            </div>
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
  const [assignDriverSelection, setAssignDriverSelection] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<TiendaConfig>(initialConfig);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [pulse, setPulse] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    pedidos: true,
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
      
      // Carga inmediata de repartidores desde Supabase
      const { data: driversData, error: driversError } = await supabase
        .from('repartidores')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (driversError) {
        console.error('Error cargando repartidores:', driversError);
      } else if (driversData) {
        setRepartidores(driversData as Repartidor[]);
      }

      const pedidos = await pedidosService.getPedidos();
      setOrders(pedidos);
    };

    void load();

    const ordersChannel = pedidosService.subscribeToOrders((pedido, eventType) => {
      setOrders((prev) => {
        if (eventType === 'DELETE') {
          return prev.filter((item) => item.id !== pedido.id);
        }

        const exists = prev.find((item) => item.id === pedido.id);
        if (!exists) {
          if (pedido.estado === 'pendiente') {
            playAttentionTone();
            toast.success(`Nuevo pedido recibido: ${pedido.id}`);
          }
          return [pedido, ...prev];
        }

        return prev.map((item) => (item.id === pedido.id ? pedido : item));
      });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 800);
    });

    // Suscripción en tiempo real a repartidores
    const driversChannel = supabase
      .channel('repartidores-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repartidores' },
        async () => {
          const { data: driversData } = await supabase
            .from('repartidores')
            .select('*')
            .order('nombre', { ascending: true });
          if (driversData) {
            setRepartidores(driversData as Repartidor[]);
          }
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
      void supabase.removeChannel(ordersChannel);
      void supabase.removeChannel(driversChannel);
      void supabase.removeChannel(publicChannel);
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

  const handleAdvanceStatus = async (order: Pedido, nextState: EstadoPedido) => {
    await handleStatusChange(order, nextState);
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

  const handleCreateDriver = async (driver: Omit<Repartidor, 'id'>) => {
    const { error } = await supabase
      .from('repartidores')
      .insert([driver]);
    
    if (error) {
      console.error('Error creando repartidor:', error);
      throw error;
    }
  };

  const handleUpdateDriver = async (id: string, updates: Partial<Repartidor>) => {
    const { error } = await supabase
      .from('repartidores')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error actualizando repartidor:', error);
      throw error;
    }
  };

  const handleDeleteDriver = async (id: string) => {
    const { error } = await supabase
      .from('repartidores')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error eliminando repartidor:', error);
      throw error;
    }
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
    if (!repartidorId) return;
    await pedidosService.updatePedido(order.id, {
      repartidor_id: repartidorId,
      updated_at: new Date().toISOString(),
    });
  };

  const handleAssignAndSend = async (order: Pedido, repartidorId: string) => {
    if (!repartidorId) {
      toast.error('Elegí un repartidor para enviar el pedido');
      return;
    }
    // Optimistic update: move locally first, then persist. Revert on failure.
    const original = orders.find((o) => o.id === order.id);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, repartidor_id: repartidorId, estado: 'en_camino', updated_at: new Date().toISOString() } : o)));
    try {
      await pedidosService.updatePedido(order.id, {
        estado: 'en_camino',
        repartidor_id: repartidorId,
        updated_at: new Date().toISOString(),
      });
      toast.success('Pedido enviado al repartidor ✅');
    } catch (err) {
      console.error('Error asignando repartidor:', err);
      toast.error('No se pudo asignar el repartidor. Revirtiendo...');
      if (original) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? original : o)));
      }
    }
  };

  const handleQuickAssign = async (order: Pedido) => {
    const availableDriver = repartidores.find((driver) => driver.estado === 'disponible');
    if (!availableDriver) {
      toast.error('No hay repartidores disponibles para asignar rápidamente');
      return;
    }

    await handleAssignAndSend(order, availableDriver.id);
  };

  const getAssignedDriverName = (order: Pedido) => {
    return repartidores.find((driver) => driver.id === order.repartidor_id)?.nombre || 'Sin asignar';
  };

  const isToday = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const getTimeElapsed = (createdAt: string): string => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <style>{`
        @media screen {
          .print-only { display: none; }
        }

        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 8px !important; margin: 0 !important; background: white !important; color: black !important; font-family: 'Courier New', Courier, monospace !important; }
          .ticket-print { width: 100% !important; font-size: 12px !important; color: black !important; }
          .ticket-header, .ticket-section, .ticket-footer { margin-bottom: 10px !important; }
          .ticket-title { font-size: 16px !important; font-weight: 700 !important; margin-bottom: 4px !important; }
          .ticket-subtitle { font-size: 12px !important; margin-bottom: 4px !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; }
          .ticket-meta, .ticket-row, .ticket-product-row { font-size: 11px !important; line-height: 1.3 !important; }
          .ticket-product-name { display: inline-block !important; width: 60% !important; word-break: break-word !important; }
          .ticket-product-qty, .ticket-product-total { display: inline-block !important; width: 18% !important; text-align: right !important; }
          .ticket-total { font-size: 13px !important; font-weight: 700 !important; }
          .ticket-divider { border-top: 1px dashed black !important; margin: 8px 0 !important; }
          .ticket-notes { white-space: pre-wrap !important; }
          button, a, input, select, textarea, nav, header, footer, .rounded-[32px], .border, .bg-[#07111f] { display: none !important; }
        }
      `}</style>
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:px-8">
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

          {/* MANAGER DE REPARTIDORES - TOP LEVEL */}
          <div className="mt-6 mb-6">
            <DriverManager
              repartidores={repartidores}
              orders={orders}
              onAddDriver={handleCreateDriver}
              onEditDriver={handleUpdateDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          </div>

<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
              <button onClick={() => toggleSection('pedidos')} className="flex w-full items-center justify-between px-4 py-4 text-left text-white">
                <span className="flex items-center gap-2 text-sm font-semibold"><CircleDollarSign className="h-4 w-4 text-cyan-400" />📦 Flujo de pedidos</span>
                {expanded['pedidos'] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {expanded['pedidos'] ? <div className="border-t border-slate-800 px-4 py-4"><KanbanOrders orders={orders} repartidores={repartidores} getTimeElapsed={getTimeElapsed} getAssignedDriverName={getAssignedDriverName} handleAdvanceStatus={handleStatusChange} handleAssignAndSend={handleAssignAndSend} handleQuickAssign={handleQuickAssign} formatCurrency={formatCurrency} assignDriverSelection={assignDriverSelection} setAssignDriverSelection={setAssignDriverSelection} /></div> : null}
            </div>

          <div className="mt-6 space-y-3">
            {[
              { key: 'comercio', title: '👤 Información del comercio', icon: UserRound, content: <div className="grid gap-3 md:grid-cols-2"><div className="space-y-3"><input value={config.nombre} onChange={(e) => setConfig({ ...config, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Nombre" /><textarea value={config.descripcion || ''} onChange={(e) => setConfig({ ...config, descripcion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Descripción" /><input value={config.subtitulo || ''} onChange={(e) => setConfig({ ...config, subtitulo: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Subtítulo / categoría" /><input value={config.direccion || ''} onChange={(e) => setConfig({ ...config, direccion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Dirección" /><input value={config.telefono || ''} onChange={(e) => setConfig({ ...config, telefono: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Teléfono" /><button onClick={() => void handleSaveBrandingConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'brand' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Actualizá la identidad del comercio para que quede visible en la tienda y en la vista de delivery.</div></div> },
              { key: 'identidad', title: '📸 Identidad visual e imágenes', icon: ImageIcon, content: <div className="grid gap-3 md:grid-cols-2"><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Logo del comercio</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('logo_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'logo_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.logo_url ? <img src={config.logo_url} alt="Preview logo" className="mt-3 h-20 w-full rounded-2xl object-cover" /> : null}</label><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Portada</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('portada_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'portada_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.portada_url ? <img src={config.portada_url} alt="Preview portada" className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}</label><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Subí imágenes reales desde tu computadora. Se actualizarán automáticamente en la tienda y en la vista de delivery.</div></div> },
              { key: 'cuentas', title: '💳 Cuentas de transferencia', icon: Landmark, content: <div className="grid gap-3 md:grid-cols-2"><input value={config.banco || ''} onChange={(e) => setConfig({ ...config, banco: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Banco" /><input value={config.titular_nombre || ''} onChange={(e) => setConfig({ ...config, titular_nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Titular" /><input value={config.titular_cuit || ''} onChange={(e) => setConfig({ ...config, titular_cuit: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CUIT / CUIL" /><input value={config.alias || ''} onChange={(e) => setConfig({ ...config, alias: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Alias" /><input value={config.cbu_cvu || ''} onChange={(e) => setConfig({ ...config, cbu_cvu: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CBU / CVU" /><button onClick={() => void handleSaveBankConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'bank' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div> },
              { key: 'categorias', title: '📚 Estructura de secciones (categorías)', icon: PackageCheck, content: <div className="space-y-3"><div className="flex gap-2"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Agregar categoría" /><button onClick={handleCreateCategory} className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">Agregar</button></div><div className="space-y-2">{categories.map((category, index) => <div key={category.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm"><div className="flex items-center gap-2"><span>{['🍕','🥟','🍔'][index % 3]}</span><span>{category.nombre}</span></div><div className="flex gap-2"><button onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.nombre); }} className="rounded-full bg-slate-800 px-3 py-1 text-xs">Editar</button><button onClick={() => { void handleDeleteCategory(category.id); }} className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-300">Eliminar</button></div></div>)}</div>{editingCategoryId ? <div className="flex gap-2"><input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" /><button onClick={() => { void handleUpdateCategory(editingCategoryId, editingCategoryName); }} className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">Guardar</button></div> : null}</div> },
              { key: 'productos', title: '🛍️ Gestión de productos', icon: Sparkles, content: <ProductSection categories={categories} products={products} filteredProducts={filteredProducts} search={search} selectedCategory={selectedCategory} setSearch={setSearch} setSelectedCategory={setSelectedCategory} newProduct={newProduct} setNewProduct={setNewProduct} editingProduct={editingProduct} setEditingProduct={setEditingProduct} editingProductId={editingProductId} setEditingProductId={setEditingProductId} currentProductImage={currentProductImage} setCurrentProductImage={setCurrentProductImage} editingProductFile={editingProductFile} setEditingProductFile={setEditingProductFile} handleSaveProducto={handleSaveProducto} handleDeleteProduct={handleDeleteProduct} handleToggleProduct={handleToggleProduct} handleUpload={handleUpload} uploadingField={uploadingField} handleNuevoProductoBtn={handleNuevoProductoBtn} /> },
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
