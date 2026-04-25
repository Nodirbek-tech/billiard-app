import { useEffect, useState } from 'react';
import { Plus, Pencil, Package, AlertTriangle, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/billing';
import { translations } from '../lib/i18n';
import type { Product } from '../lib/types';

const CATEGORIES = ['drinks', 'hot_drinks', 'food', 'snacks', 'other'];

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase.from('products').select('*').order('category').order('name');
    setProducts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!editProduct?.name || !editProduct.price) { setError('Name and price required'); return; }
    setSaving(true);
    setError('');

    if (editProduct.id) {
      const { error } = await supabase.from('products').update({
        name: editProduct.name,
        category: editProduct.category ?? 'other',
        price: editProduct.price,
        stock: editProduct.stock ?? 0,
        is_active: editProduct.is_active ?? true,
      }).eq('id', editProduct.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('products').insert({
        name: editProduct.name!,
        category: editProduct.category ?? 'other',
        price: editProduct.price!,
        stock: editProduct.stock ?? 0,
        is_active: true,
        sold_count: 0,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setEditProduct(null);
    load();
  }

  async function handleRestock() {
    if (!restockProduct) return;
    setSaving(true);
    await supabase.from('products').update({ stock: restockProduct.stock + restockAmount }).eq('id', restockProduct.id);
    await supabase.from('stock_movements').insert({
      product_id: restockProduct.id,
      quantity_change: restockAmount,
      movement_type: 'restock',
      note: 'Manual restock',
    });
    setSaving(false);
    setRestockProduct(null);
    load();
  }

  async function toggleActive(product: Product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    load();
  }

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.nav.products}</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} mahsulot</p>
        </div>
        <button
          onClick={() => setEditProduct({ name: '', category: 'drinks', price: 0, stock: 0, is_active: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {translations.actions.addProduct}
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={translations.actions.search + " mahsulotlarni..."}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{translations.empty.noProducts}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mahsulot</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kategoriya</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Narxi</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Zaxira</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Sotilgan</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-500">{p.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${p.stock <= 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {p.stock}
                      {p.stock <= 5 && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.sold_count}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditProduct(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setRestockProduct(p); setRestockAmount(10); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Restock">
                        <Package className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Toggle Active">
                        {p.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!editProduct} onClose={() => { setEditProduct(null); setError(''); }} title={editProduct?.id ? 'Edit Product' : 'Add Product'} size="md">
        {editProduct && (
          <div className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <input value={editProduct.name ?? ''} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={editProduct.category ?? 'other'} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (UZS) *</label>
              <input type="number" value={editProduct.price ?? 0} onChange={(e) => setEditProduct({ ...editProduct, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
              <input type="number" value={editProduct.stock ?? 0} onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!restockProduct} onClose={() => setRestockProduct(null)} title="Restock Product" size="sm">
        {restockProduct && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Current stock: <strong>{restockProduct.stock}</strong></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Quantity</label>
              <input type="number" value={restockAmount} min={1} onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <p className="text-sm text-gray-500">New stock will be: <strong>{restockProduct.stock + restockAmount}</strong></p>
            <button onClick={handleRestock} disabled={saving} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Confirm Restock'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
