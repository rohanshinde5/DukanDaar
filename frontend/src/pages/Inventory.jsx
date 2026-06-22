import { useState, useEffect, useRef } from 'react';
import api, { mlApi } from '../services/api';
import { Package, Plus, Edit2, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, item_name: '', quantity: '', cost_price: '', selling_price: '', expiry_date: '', sales_speed: '' });
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Debouncing refs
  const pendingQtyUpdates = useRef({});
  const debounceTimers = useRef({});

  useEffect(() => {
    fetchInventory();
  }, [page]);

  const fetchInventory = async (searchTerm = '') => {
    try {
      const res = await api.get(`/inventory?search=${searchTerm}&page=${page}&limit=20`);
      // Fetch ML velocity for all
      const enriched = await Promise.all(res.data.map(async (item) => {
        try {
          const mlRes = await mlApi.post('/inventory-velocity', {
            item_id: item._id,
            sales_speed: item.sales_speed || 0,
            current_volume: item.quantity
          });
          return { ...item, days_until_empty: mlRes.data.days_until_empty, restock_quota: mlRes.data.restock_quota };
        } catch (e) {
          return { ...item, days_until_empty: 999, restock_quota: 0 };
        }
      }));
      setInventory(enriched);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length > 2 || e.target.value === '') {
      fetchInventory(e.target.value);
    }
  };

  // Add / Edit CRUD Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (Number(form.quantity) < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    const payload = {
      item_name: form.item_name,
      quantity: Number(form.quantity),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      expiry_date: new Date(form.expiry_date),
      sales_speed: Number(form.sales_speed) || 0
    };

    try {
      if (form.id) {
        await api.put(`/inventory/${form.id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setIsModalOpen(false);
      fetchInventory(search);
      setForm({ id: null, item_name: '', quantity: '', cost_price: '', selling_price: '', expiry_date: '', sales_speed: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const openModal = (item = null) => {
    setError('');
    if (item) {
      setForm({
        id: item._id,
        item_name: item.item_name,
        quantity: item.quantity,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '',
        sales_speed: item.sales_speed || 0
      });
    } else {
      setForm({ id: null, item_name: '', quantity: '', cost_price: '', selling_price: '', expiry_date: '', sales_speed: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? Past transactions will retain a text record of the item name.')) return;
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory(search);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Debounced Quick Qty adjustment (+/-)
  const handleQuickQtyAdjust = (item, delta) => {
    const itemId = item._id;
    
    // Calculate new quantity locally
    const currentLocalQty = pendingQtyUpdates.current[itemId] !== undefined 
      ? pendingQtyUpdates.current[itemId] 
      : item.quantity;
      
    const newQty = currentLocalQty + delta;
    
    // Negative Stock Guardrail (frontend check)
    if (newQty < 0) return;

    // 1. Instantly update UI State to keep UI extremely snappy
    pendingQtyUpdates.current[itemId] = newQty;
    setInventory((prev) => 
      prev.map((i) => (i._id === itemId ? { ...i, quantity: newQty } : i))
    );

    // 2. Debounce backend sync
    if (debounceTimers.current[itemId]) {
      clearTimeout(debounceTimers.current[itemId]);
    }

    debounceTimers.current[itemId] = setTimeout(async () => {
      try {
        const qtyToSend = pendingQtyUpdates.current[itemId];
        delete pendingQtyUpdates.current[itemId];
        delete debounceTimers.current[itemId];
        
        // Sync with database
        const res = await api.put(`/inventory/${itemId}`, { quantity: qtyToSend });
        
        // Live re-calculate ML velocity stats for this item after DB sync
        try {
          const mlRes = await mlApi.post('/inventory-velocity', {
            item_id: itemId,
            sales_speed: res.data.sales_speed || 0,
            current_volume: res.data.quantity
          });
          setInventory((prev) =>
            prev.map((i) =>
              i._id === itemId
                ? { ...i, days_until_empty: mlRes.data.days_until_empty, restock_quota: mlRes.data.restock_quota }
                : i
            )
          );
        } catch (mlErr) {
          console.error('ML Sync failed', mlErr);
        }
      } catch (err) {
        console.error('Backend sync failed', err);
        // Fallback UI to match DB if update fails
        fetchInventory(search);
      }
    }, 500); // 500ms debounce
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <Package className="text-brand-muted" size={24} /> Inventory Controls
          </h1>
          <p className="text-sm text-brand-muted mt-1">Manage warehouse stock level quotas and details</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-text text-brand-surface px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
        <input
          type="text"
          placeholder="Search products..."
          className="px-4 py-2 border border-gray-200 rounded-xl w-full md:max-w-xs focus:outline-none"
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="bg-brand-surface border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-brand-muted text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Stock Count</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">ML Restock Need</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-brand-muted">
                    No inventory products found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isExpired = new Date(item.expiry_date) < new Date();
                  const isLowStock = item.quantity < 10;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-brand-text">
                        {item.item_name}
                        {isExpired && (
                          <span className="ml-2 bg-brand-red-bg text-brand-red-text text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuickQtyAdjust(item, -1)}
                            className="p-1 hover:bg-gray-100 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center text-brand-muted hover:text-brand-text"
                          >
                            <MinusCircle size={16} />
                          </button>
                          <span className={`px-2 py-1 rounded text-xs font-bold w-12 text-center ${
                            isLowStock ? 'bg-brand-red-bg text-brand-red-text' : 'bg-brand-green-bg text-brand-green-text'
                          }`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuickQtyAdjust(item, 1)}
                            className="p-1 hover:bg-gray-100 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center text-brand-muted hover:text-brand-text"
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand-text">₹{item.selling_price}</td>
                      <td className="px-6 py-4 text-brand-muted">₹{item.cost_price}</td>
                      <td className="px-6 py-4 text-brand-muted">
                        <span className={isExpired ? 'text-brand-red-text font-semibold' : ''}>
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.days_until_empty < 7 ? (
                          <span className="text-brand-yellow-text font-semibold bg-brand-yellow-bg/50 px-2 py-0.5 rounded text-xs">
                            Refill {item.restock_quota} soon ({item.days_until_empty}d left)
                          </span>
                        ) : (
                          <span className="text-brand-muted text-xs">Safe ({item.days_until_empty} days)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-brand-muted hover:text-brand-text rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-brand-red-text hover:bg-brand-red-bg/50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 min-h-[44px]"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-brand-muted">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={inventory.length < 20}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 min-h-[44px]"
        >
          Next
        </button>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-brand-text">
                {form.id ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-brand-red-text bg-brand-red-bg p-2 rounded-lg">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Quantity (Stock)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Sales Speed (item/day)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                    value={form.sales_speed}
                    onChange={(e) => setForm({ ...form, sales_speed: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Batch Expiry Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-text text-brand-surface py-3 rounded-xl font-semibold hover:opacity-90 min-h-[44px]"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
