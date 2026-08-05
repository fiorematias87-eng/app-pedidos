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
  filteredProducts: Producto[];
  search: string;
  selectedCategory: string;
  setSearch: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  newProduct: ProductFormState;
  setNewProduct: React.Dispatch<React.SetStateAction<ProductFormState>>;
  editingProductId: string | null;
  editingProduct: Partial<Producto>;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingProduct: React.Dispatch<React.SetStateAction<Partial<Producto>>>;
  handleCreateProduct: () => Promise<void>;
  handleUpdateProduct: (id: string) => Promise<void>;
  handleDeleteProduct: (id: string) => Promise<void>;
  handleToggleProduct: (product: Producto, value: boolean) => Promise<void>;
  handleUpload: (field: 'logo_url' | 'portada_url' | 'imagen_url', file: File | null) => Promise<void>;
  uploadingField: string | null;
};

function ProductSection({
  categories,
  filteredProducts,
  search,
  selectedCategory,
  setSearch,
  setSelectedCategory,
  newProduct,
  setNewProduct,
  editingProductId,
  editingProduct,
  setEditingProductId,
  setEditingProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleToggleProduct,
  handleUpload,
  uploadingField,
}: ProductSectionProps) {
  const categoriesWithProducts = categories.filter((category) => filteredProducts.some((product) => product.categoria_id === category.id));
  const categoryDisplay = selectedCategory === 'all' ? categoriesWithProducts : categoriesWithProducts.filter((category) => category.id === selectedCategory);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Buscar producto por nombre..." />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory('all')} className={`rounded-full px-3 py-2 text-sm ${selectedCategory === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
            Todos
          </button>
          {categoriesWithProducts.map((category) => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`rounded-full px-3 py-2 text-sm ${selectedCategory === category.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              {category.nombre} <span className="ml-2 rounded-full bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-300">{filteredProducts.filter((product) => product.categoria_id === category.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-white">Filtrar productos creados</span>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none sm:w-auto">
            <option value="all">Todos</option>
            {categoriesWithProducts.map((category) => (
              <option key={category.id} value={category.id}>{category.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">+ CREAR NUEVO ARTÍCULO</span>
          <button onClick={() => void handleCreateProduct()} className="rounded-full bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950">Crear</button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={newProduct.nombre} onChange={(e) => setNewProduct((prev) => ({ ...prev, nombre: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Nombre" />
          <input value={newProduct.precio} onChange={(e) => setNewProduct((prev) => ({ ...prev, precio: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Precio" />
          <textarea value={newProduct.descripcion} onChange={(e) => setNewProduct((prev) => ({ ...prev, descripcion: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none md:col-span-2" placeholder="Descripción" />
          <select value={newProduct.categoria_id} onChange={(e) => setNewProduct((prev) => ({ ...prev, categoria_id: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none">
            <option value="">Seleccioná categoría</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>
          <label className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm">
            <span className="mb-2 block text-slate-400">Foto del producto</span>
            <input type="file" accept="image/*" onChange={(e) => void handleUpload('imagen_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />
            {uploadingField === 'imagen_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}
            {newProduct.imagen_url ? <img src={newProduct.imagen_url} alt="Preview producto" className="mt-3 h-20 w-full rounded-2xl object-cover" /> : null}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" checked={newProduct.disponible} onChange={(e) => setNewProduct((prev) => ({ ...prev, disponible: e.target.checked }))} />
            Disponible
          </label>
        </div>
      </div>

      <div className="space-y-3 max-h-[62vh] overflow-y-auto custom-scrollbar">
        {categories.map((category) => {
          const productsInCategory = filteredProducts.filter((product) => product.categoria_id === category.id);
          if (!productsInCategory.length && selectedCategory !== 'all') return null;
          if (selectedCategory !== 'all' && selectedCategory !== category.id) return null;
          return (
            <details key={category.id} className="rounded-2xl border border-slate-800 bg-slate-900/70" open={selectedCategory !== 'all'}>
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-white outline-none">{category.nombre} <span className="ml-2 rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">{productsInCategory.length}</span></summary>
              <div className="space-y-3 border-t border-slate-800 px-4 py-4">
                {productsInCategory.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{product.nombre}</p>
                        <p className="text-xs text-slate-400">{product.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-amber-400">{formatCurrency(product.precio)}</span>
                        <button onClick={() => void handleToggleProduct(product, !product.disponible)} className={`rounded-full px-3 py-2 text-xs ${product.disponible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                          {product.disponible ? 'Disponible' : 'Pausado'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => { setEditingProductId(product.id); setEditingProduct(product); }} className="rounded-full bg-slate-800 px-3 py-2 text-xs">Editar</button>
                      <button onClick={() => void handleDeleteProduct(product.id)} className="rounded-full bg-rose-500/15 px-3 py-2 text-xs text-rose-300">Eliminar</button>
                    </div>
                    {editingProductId === product.id ? (
                      <div className="mt-3 space-y-2">
                        <input value={editingProduct.nombre || ''} onChange={(e) => setEditingProduct((prev) => ({ ...prev, nombre: e.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" />
                        <input value={editingProduct.precio?.toString() || ''} onChange={(e) => setEditingProduct((prev) => ({ ...prev, precio: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" />
                        <textarea value={editingProduct.descripcion || ''} onChange={(e) => setEditingProduct((prev) => ({ ...prev, descripcion: e.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" />
                        <select value={editingProduct.categoria_id || ''} onChange={(e) => setEditingProduct((prev) => ({ ...prev, categoria_id: e.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none">
                          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                        </select>
                        <label className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300">
                          <span className="mb-2 block text-slate-400">Nueva imagen</span>
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setEditingProductFile(file);
                            if (file) {
                              setEditingProduct((prev) => ({ ...prev, imagen_url: URL.createObjectURL(file) }));
                            }
                          }} className="w-full text-slate-300" />
                          {editingProduct.imagen_url ? <img src={editingProduct.imagen_url} alt="Preview edición" className="mt-3 h-20 w-full rounded-2xl object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27250%27%3E%3Crect width=%27400%27 height=%27250%27 fill=%27%23222%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2720%27 fill=%27%23aaa%27%3ESin imagen%3C/text%3E%3C/svg%3E'; }} /> : null}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                          <input type="checkbox" checked={Boolean(editingProduct.disponible)} onChange={(e) => setEditingProduct((prev) => ({ ...prev, disponible: e.target.checked }))} />
                          Disponible
                        </label>
                        <button onClick={() => void handleUpdateProduct(product.id)} className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">Guardar cambios</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Producto>>({});
  const [newDriver, setNewDriver] = useState({ nombre: '', telefono: '', estado: 'disponible' as Repartidor['estado'] });
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Partial<Repartidor>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [editingProductFile, setEditingProductFile] = useState<File | null>(null);
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
      setConfig(data as TiendaConfig);
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
    setCategorias(data || []);
  };

  const fetchAdminData = async () => {
    const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] = await Promise.all([
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
      supabase.from('productos').select('*').order('created_at', { ascending: false }),
    ]);

    if (!catErr && catData) {
      setCategorias(catData);
    } else if (catErr) {
      console.error('Error leyendo categorias:', catErr);
    }

    if (!prodErr && prodData) {
      setProducts(prodData);
    } else if (prodErr) {
      console.error('Error leyendo productos:', prodErr);
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchStoreConfig(), fetchAdminData()]);
      const [drivers, pedidos] = await Promise.all([pedidosService.getRepartidores(), pedidosService.getPedidos()]);
      setRepartidores(drivers);
      setOrders(pedidos);
    };

    void load();

    const ordersChannel = pedidosService.subscribeToOrders((pedido) => {
      setOrders((prev) => {
        const exists = prev.find((item) => item.id === pedido.id);
        if (!exists) {
          toast.success('¡Nuevo pedido recibido! 🔔');
          return [pedido, ...prev];
        }
        return prev.map((item) => (item.id === pedido.id ? pedido : item));
      });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 800);
    });

    const publicChannel = pedidosService.subscribeToPublicAll({
      storeConfig: (nextConfig) => {
        setConfig(nextConfig);
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

  const filteredProducts = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return products.filter((producto) => {
      const matchesCategory = selectedCategory === 'all' || producto.categoria_id === selectedCategory;
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
    return data as TiendaConfig;
  };

  const uploadBrandAsset = async (field: 'logo_url' | 'portada_url', file: File | null) => {
    if (!file) return null;
    setUploadingField(field);
    try {
      const publicUrl = await uploadImage(file, 'imagenes');
      setConfig((prev) => ({ ...prev, [field]: publicUrl } as TiendaConfig));
      return publicUrl;
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveBrandingConfig = async () => {
    setSavingConfigSection('brand');
    try {
      await uploadBrandAsset('logo_url', logoFile);
      await uploadBrandAsset('portada_url', portadaFile);
      await persistConfig(config);
      setLogoFile(null);
      setPortadaFile(null);
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
      await uploadBrandAsset('logo_url', logoFile);
      await uploadBrandAsset('portada_url', portadaFile);
      await persistConfig(config);
      setLogoFile(null);
      setPortadaFile(null);
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
      setNewProduct({ nombre: '', descripcion: '', precio: '', categoria_id: '', imagen_url: '', disponible: true });
      await fetchAdminData();
      toast.success('Producto creado con éxito ✅');
    } catch {
      toast.error('No se pudo crear el producto');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleUpdateProduct = async (id: string) => {
    if (!editingProduct.nombre || !editingProduct.precio || !editingProduct.categoria_id) return;

    const updates: Partial<Producto> = {
      nombre: editingProduct.nombre,
      descripcion: editingProduct.descripcion,
      precio: Number(editingProduct.precio),
      categoria_id: editingProduct.categoria_id,
      disponible: editingProduct.disponible,
      updated_at: new Date().toISOString(),
    };

    if (editingProductFile) {
      setUploadingField('imagen_url');
      try {
        const filePath = `productos/${Date.now()}-${editingProductFile.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('imagenes').upload(filePath, editingProductFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(filePath);
        updates.imagen_url = urlData.publicUrl;
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

    const { error } = await supabase.from('productos').update(updates).eq('id', id);
    if (error) {
      console.error('Error actualizando producto:', error);
      toast.error('No se pudo actualizar el producto');
      return;
    }
    setEditingProductId(null);
    setEditingProduct({});
    await fetchAdminData();
  };

  const handleDeleteProduct = async (id: string) => {
    await pedidosService.deleteProduct(id);
    await fetchAdminData();
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
        if (editingProductId) {
          setEditingProduct((prev) => ({ ...prev, imagen_url: publicUrl }));
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

          <div className="mt-6 space-y-3">
            {[
              { key: 'caja', title: '💰 Cierre de caja y métricas', icon: CircleDollarSign, content: <div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-sm text-slate-400">Ventas hoy</p><p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(ventasHoy)}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-sm text-slate-400">Pedidos</p><p className="mt-2 text-2xl font-semibold text-white">{pedidosHoy}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-sm text-slate-400">Ticket promedio</p><p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(ticketPromedio)}</p></div></div> },
              { key: 'comercio', title: '👤 Información del comercio', icon: UserRound, content: <div className="grid gap-3 md:grid-cols-2"><div className="space-y-3"><input value={config.nombre} onChange={(e) => setConfig({ ...config, nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Nombre" /><textarea value={config.descripcion || ''} onChange={(e) => setConfig({ ...config, descripcion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Descripción" /><input value={config.subtitulo || ''} onChange={(e) => setConfig({ ...config, subtitulo: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Subtítulo / categoría" /><input value={config.direccion || ''} onChange={(e) => setConfig({ ...config, direccion: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Dirección" /><input value={config.telefono || ''} onChange={(e) => setConfig({ ...config, telefono: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Teléfono" /><button onClick={() => void handleSaveBrandingConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'brand' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Actualizá la identidad del comercio para que quede visible en la tienda y en la vista de delivery.</div></div> },
              { key: 'identidad', title: '📸 Identidad visual e imágenes', icon: ImageIcon, content: <div className="grid gap-3 md:grid-cols-2"><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Logo del comercio</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('logo_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'logo_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.logo_url ? <img src={config.logo_url} alt="Preview logo" className="mt-3 h-20 w-full rounded-2xl object-cover" /> : null}</label><label className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm"><span className="mb-2 block text-slate-400">Portada</span><input type="file" accept="image/*" onChange={(e) => void handleUpload('portada_url', e.target.files?.[0] || null)} className="w-full text-slate-300" />{uploadingField === 'portada_url' ? <div className="mt-2 flex items-center gap-2 text-cyan-400"><Loader2 className="h-4 w-4 animate-spin" />Subiendo imagen...</div> : null}{config.portada_url ? <img src={config.portada_url} alt="Preview portada" className="mt-3 h-24 w-full rounded-2xl object-cover" /> : null}</label><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">Subí imágenes reales desde tu computadora. Se actualizarán automáticamente en la tienda y en la vista de delivery.</div></div> },
              { key: 'cuentas', title: '💳 Cuentas de transferencia', icon: Landmark, content: <div className="grid gap-3 md:grid-cols-2"><input value={config.banco || ''} onChange={(e) => setConfig({ ...config, banco: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Banco" /><input value={config.titular_nombre || ''} onChange={(e) => setConfig({ ...config, titular_nombre: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Titular" /><input value={config.titular_cuit || ''} onChange={(e) => setConfig({ ...config, titular_cuit: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CUIT / CUIL" /><input value={config.alias || ''} onChange={(e) => setConfig({ ...config, alias: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Alias" /><input value={config.cbu_cvu || ''} onChange={(e) => setConfig({ ...config, cbu_cvu: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="CBU / CVU" /><button onClick={() => void handleSaveBankConfig()} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">{savingConfigSection === 'bank' ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}</button></div> },
              { key: 'categorias', title: '📚 Estructura de secciones (categorías)', icon: PackageCheck, content: <div className="space-y-3"><div className="flex gap-2"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" placeholder="Agregar categoría" /><button onClick={handleCreateCategory} className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">Agregar</button></div><div className="space-y-2">{categories.map((category, index) => <div key={category.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm"><div className="flex items-center gap-2"><span>{['🍕','🥟','🍔'][index % 3]}</span><span>{category.nombre}</span></div><div className="flex gap-2"><button onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.nombre); }} className="rounded-full bg-slate-800 px-3 py-1 text-xs">Editar</button><button onClick={() => { void handleDeleteCategory(category.id); }} className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-300">Eliminar</button></div></div>)}</div>{editingCategoryId ? <div className="flex gap-2"><input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none" /><button onClick={() => { void handleUpdateCategory(editingCategoryId, editingCategoryName); }} className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">Guardar</button></div> : null}</div> },
              { key: 'productos', title: '🛍️ Gestión de productos', icon: Sparkles, content: <ProductSection categories={categories} filteredProducts={filteredProducts} search={search} selectedCategory={selectedCategory} setSearch={setSearch} setSelectedCategory={setSelectedCategory} newProduct={newProduct} setNewProduct={setNewProduct} editingProductId={editingProductId} editingProduct={editingProduct} setEditingProductId={setEditingProductId} setEditingProduct={setEditingProduct} handleCreateProduct={handleCreateProduct} handleUpdateProduct={handleUpdateProduct} handleDeleteProduct={handleDeleteProduct} handleToggleProduct={handleToggleProduct} handleUpload={handleUpload} uploadingField={uploadingField} /> },
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
