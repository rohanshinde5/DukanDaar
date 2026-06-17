import { useState, useEffect } from 'react';
import api, { mlApi } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchTerm = '') => {
    try {
      const res = await api.get(`/customers?search=${searchTerm}`);
      // Fetch ML risk for all
      const enriched = await Promise.all(res.data.map(async (c) => {
        try {
          const mlRes = await mlApi.post('/predict-risk', {
            customer_id: c._id,
            delay_velocity: c.delay_velocity || 0,
            current_debt: c.total_outstanding_debt
          });
          return { ...c, risk_category: mlRes.data.risk_category };
        } catch (e) {
          return c;
        }
      }));
      setCustomers(enriched);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length > 2 || e.target.value === '') {
      fetchCustomers(e.target.value);
    }
  };

  const getBadgeClass = (risk) => {
    switch(risk) {
      case 'High': return 'bg-brand-red-bg text-brand-red-text';
      case 'Medium': return 'bg-brand-yellow-bg text-brand-yellow-text';
      case 'Low': return 'bg-brand-green-bg text-brand-green-text';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-brand-text">Customers Matrix</h1>
        <input 
          type="text" 
          placeholder="Search phone number..." 
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
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Outstanding Debt</th>
                <th className="px-6 py-4 font-medium">ML Risk Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => alert('Credit ceiling notification placeholder')}>
                  <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-brand-muted">{c.phone}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{c.total_outstanding_debt}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeClass(c.risk_category)}`}>
                      {c.risk_category === 'High' ? '🔴 High' : c.risk_category === 'Medium' ? '🟡 Medium' : c.risk_category === 'Low' ? '🟢 Low' : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
