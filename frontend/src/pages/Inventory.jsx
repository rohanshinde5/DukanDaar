import { useState, useEffect } from 'react';
import api, { mlApi } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (searchTerm = '') => {
    try {
      const res = await api.get(`/inventory?search=${searchTerm}`);
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
          return item;
        }
      }));
      setInventory(enriched);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length > 2 || e.target.value === '') {
      fetchInventory(e.target.value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-brand-text">Inventory Controls</h1>
        <input 
          type="text" 
          placeholder="Search products..." 
          className="px-4 py-2 border border-gray-200 rounded-xl"
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="bg-brand-surface border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-brand-muted text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium">ML Restock Need</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map(item => {
                const isExpired = new Date(item.expiry_date) < new Date();
                const isLowStock = item.quantity < 10;
                return (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{item.item_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isLowStock ? 'bg-brand-red-bg text-brand-red-text' : 'bg-brand-green-bg text-brand-green-text'}`}>
                        {item.quantity} {isLowStock ? '(Low)' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">₹{item.selling_price}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={isExpired ? 'text-brand-red-text font-bold' : ''}>
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.days_until_empty < 7 ? (
                        <span className="text-brand-yellow-text font-semibold">Refill {item.restock_quota} soon</span>
                      ) : (
                        <span className="text-brand-muted">Safe ({item.days_until_empty} days)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
