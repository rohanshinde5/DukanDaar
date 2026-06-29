import { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

const Wholesalers = () => {
  const [wholesalers, setWholesalers] = useState([]);
  const [selectedWholesaler, setSelectedWholesaler] = useState(null);
  const [isWModalOpen, setIsWModalOpen] = useState(false);
  const [isPModalOpen, setIsPModalOpen] = useState(false);
  const [wForm, setWForm] = useState({ id: null, name: '', phone: '' });
  const [pForm, setPForm] = useState({ amount: '', description: '', purchase_date: '', status: 'Unpaid' });
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchWholesalers();
  }, [page]);

  const fetchWholesalers = async () => {
    try {
      const res = await api.get(`/wholesalers?page=${page}&limit=20`);
      setWholesalers(res.data);
    } catch (err) {
      console.error('Error fetching wholesalers:', err);
    }
  };

  const fetchWholesalerDetails = async (id) => {
    try {
      const res = await api.get(`/wholesalers/${id}`);
      setSelectedWholesaler(res.data);
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          document.getElementById('wholesaler-details')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Error fetching wholesaler details:', err);
    }
  };

  // Wholesaler CRUD
  const handleWSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (wForm.id) {
        await api.put(`/wholesalers/${wForm.id}`, { name: wForm.name, phone: wForm.phone });
      } else {
        await api.post('/wholesalers', { name: wForm.name, phone: wForm.phone });
      }
      setIsWModalOpen(false);
      setWForm({ id: null, name: '', phone: '' });
      fetchWholesalers();
      if (selectedWholesaler && selectedWholesaler._id === wForm.id) {
        fetchWholesalerDetails(wForm.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleWDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this wholesaler?')) return;
    try {
      await api.delete(`/wholesalers/${id}`);
      if (selectedWholesaler?._id === id) {
        setSelectedWholesaler(null);
      }
      fetchWholesalers();
    } catch (err) {
      console.error('Error deleting wholesaler:', err);
    }
  };

  const openWModal = (w = null) => {
    setError('');
    if (w) {
      setWForm({ id: w._id, name: w.name, phone: w.phone });
    } else {
      setWForm({ id: null, name: '', phone: '' });
    }
    setIsWModalOpen(true);
  };

  // Purchase CRUD
  const handlePSubmit = async (e) => {
    e.preventDefault();
    if (!pForm.amount || isNaN(pForm.amount)) {
      setError('Please enter a valid amount.');
      return;
    }
    try {
      const payload = {
        amount: Number(pForm.amount),
        description: pForm.description,
        status: pForm.status
      };
      if (pForm.purchase_date) {
        payload.purchase_date = pForm.purchase_date;
      }
      const res = await api.post(`/wholesalers/${selectedWholesaler._id}/purchases`, payload);
      setSelectedWholesaler(res.data);
      setIsPModalOpen(false);
      setPForm({ amount: '', description: '', purchase_date: '', status: 'Unpaid' });
      fetchWholesalers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add purchase');
    }
  };

  const handlePToggle = async (purchaseId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Unpaid' ? 'Paid' : 'Unpaid';
      const res = await api.put(`/wholesalers/${selectedWholesaler._id}/purchases/${purchaseId}`, {
        status: newStatus
      });
      setSelectedWholesaler(res.data);
      fetchWholesalers();
    } catch (err) {
      console.error('Error toggling purchase status:', err);
    }
  };

  const handlePDelete = async (purchaseId) => {
    if (!window.confirm('Delete this purchase record?')) return;
    try {
      const res = await api.delete(`/wholesalers/${selectedWholesaler._id}/purchases/${purchaseId}`);
      setSelectedWholesaler(res.data);
      fetchWholesalers();
    } catch (err) {
      console.error('Error deleting purchase:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <Truck className="text-brand-muted" size={24} /> Wholesalers Manager
          </h1>
          <p className="text-sm text-brand-muted mt-1">Manage suppliers, purchase items, and payables</p>
        </div>
        <button
          onClick={() => openWModal()}
          className="bg-brand-text text-brand-surface px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wholesalers Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-brand-surface border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-brand-muted text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">Wholesaler</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Upcoming Dues</th>
                    <th className="px-6 py-4">Next Due Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {wholesalers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-brand-muted">
                        No wholesalers found. Add a supplier to get started!
                      </td>
                    </tr>
                  ) : (
                    wholesalers.map((w) => (
                      <tr
                        key={w._id}
                        onClick={() => fetchWholesalerDetails(w._id)}
                        className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${
                          selectedWholesaler?._id === w._id ? 'bg-brand-bg/50 font-medium' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-brand-text">{w.name}</td>
                        <td className="px-6 py-4 text-brand-muted">{w.phone}</td>
                        <td className="px-6 py-4 font-semibold text-brand-text">₹{w.upcoming_dues}</td>
                        <td className="px-6 py-4 text-brand-muted">
                          {w.due_date ? new Date(w.due_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openWModal(w)}
                              className="p-2 text-brand-muted hover:text-brand-text rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleWDelete(w._id)}
                              className="p-2 text-brand-red-text hover:bg-brand-red-bg/50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
              disabled={wholesalers.length < 20}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 min-h-[44px]"
            >
              Next
            </button>
          </div>
        </div>

        {/* Selected Wholesaler Purchases Detail View */}
        <div id="wholesaler-details" className="bg-brand-surface border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col h-fit">
          {selectedWholesaler ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-brand-text">{selectedWholesaler.name}</h2>
                  <p className="text-xs text-brand-muted mt-0.5">{selectedWholesaler.phone}</p>
                </div>
                <button
                  onClick={() => setIsPModalOpen(true)}
                  className="bg-brand-bg text-brand-text px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 flex items-center gap-1 min-h-[36px]"
                >
                  <Plus size={14} /> Add Purchase
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 bg-brand-bg p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-brand-muted">Upcoming Dues</p>
                  <p className="text-lg font-extrabold text-brand-red-text mt-0.5">₹{selectedWholesaler.upcoming_dues}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-brand-muted">Paid Purchases</p>
                  <p className="text-lg font-extrabold text-brand-green-text mt-0.5">
                    ₹{selectedWholesaler.purchases
                      .filter((p) => p.status === 'Paid')
                      .reduce((sum, p) => sum + p.amount, 0)}
                  </p>
                </div>
              </div>

              {/* Purchases Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Purchase Logs</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {selectedWholesaler.purchases.length === 0 ? (
                    <p className="text-sm text-brand-muted text-center py-6">No purchases logged yet.</p>
                  ) : (
                    selectedWholesaler.purchases.map((p) => (
                      <div key={p._id} className="p-3 border border-gray-100 rounded-xl space-y-2 hover:border-gray-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm text-brand-text">₹{p.amount}</p>
                            <p className="text-xs text-brand-muted mt-0.5">{p.description || 'No description'}</p>
                          </div>
                          <button
                            onClick={() => handlePToggle(p._id, p.status)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all min-h-[32px] flex items-center gap-1 ${
                              p.status === 'Paid'
                                ? 'bg-brand-green-bg text-brand-green-text hover:bg-red-50 hover:text-brand-red-text'
                                : 'bg-brand-red-bg text-brand-red-text hover:bg-green-50 hover:text-brand-green-text'
                            }`}
                            title="Click to toggle Paid/Unpaid"
                          >
                            {p.status === 'Paid' ? (
                              <>
                                <CheckCircle size={10} /> Paid
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} /> Unpaid
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-50 text-[10px] text-brand-muted">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> {new Date(p.purchase_date).toLocaleDateString()}
                          </span>
                          <span>Due: {new Date(p.due_date).toLocaleDateString()}</span>
                          <button
                            onClick={() => handlePDelete(p._id)}
                            className="text-brand-red-text hover:underline min-h-[32px] px-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Truck size={40} className="text-gray-200 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-brand-muted">Select a wholesaler</p>
              <p className="text-xs text-brand-muted/70 mt-1">Click a row on the left to view purchase details and payments</p>
            </div>
          )}
        </div>
      </div>

      {/* Wholesaler Add/Edit Modal */}
      {isWModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-brand-text">
                {wForm.id ? 'Edit Supplier' : 'Add Supplier'}
              </h3>
              <button
                onClick={() => setIsWModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-brand-red-text bg-brand-red-bg p-2 rounded-lg">{error}</p>}
            <form onSubmit={handleWSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Company/Wholesaler Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={wForm.name}
                  onChange={(e) => setWForm({ ...wForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={wForm.phone}
                  onChange={(e) => setWForm({ ...wForm, phone: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-text text-brand-surface py-3 rounded-xl font-semibold hover:opacity-90 min-h-[44px]"
              >
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {isPModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-brand-text">Log Purchase - {selectedWholesaler.name}</h3>
              <button
                onClick={() => setIsPModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-brand-red-text bg-brand-red-bg p-2 rounded-lg">{error}</p>}
            <form onSubmit={handlePSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Purchase Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={pForm.amount}
                  onChange={(e) => setPForm({ ...pForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Item Details/Description</label>
                <input
                  type="text"
                  placeholder="e.g. 10 Bags of Basmati Rice"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={pForm.description}
                  onChange={(e) => setPForm({ ...pForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Purchase Date (Default: Today)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={pForm.purchase_date}
                  onChange={(e) => setPForm({ ...pForm, purchase_date: e.target.value })}
                />
                <span className="text-[10px] text-brand-muted mt-1 block">Due date will automatically be set to 3 months later.</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Initial Status</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-text"
                  value={pForm.status}
                  onChange={(e) => setPForm({ ...pForm, status: e.target.value })}
                >
                  <option value="Unpaid">Unpaid (Add to Dues)</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-brand-text text-brand-surface py-3 rounded-xl font-semibold hover:opacity-90 min-h-[44px]"
              >
                Log Purchase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wholesalers;
