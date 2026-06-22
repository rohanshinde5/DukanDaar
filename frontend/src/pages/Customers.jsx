import { useState, useEffect } from 'react';
import api, { mlApi } from '../services/api';
import { Users, Eye, X, AlertCircle, ShoppingBag, Calendar, CheckCircle } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Repayment form states
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState('Cash');
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchTerm = '') => {
    try {
      const res = await api.get(`/customers?search=${searchTerm}`);
      const enriched = await Promise.all(res.data.map(async (c) => {
        try {
          const mlRes = await mlApi.post('/predict-risk', {
            customer_id: c._id,
            delay_velocity: c.delay_velocity || 0,
            current_debt: c.total_outstanding_debt
          });
          return { ...c, risk_category: mlRes.data.risk_category };
        } catch (e) {
          return { ...c, risk_category: 'Low' };
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

  const handleRowClick = async (customer) => {
    setSelectedCustomer(customer);
    setRepaymentAmount('');
    setRepaymentMethod('Cash');
    setRepayError('');
    setRepaySuccess('');
    setIsModalOpen(true);
    try {
      const res = await api.get(`/transactions?customer=${customer._id}`);
      setInvoices(res.data);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
    }
  };

  const handleRepayment = async (e, clearAll = false) => {
    e?.preventDefault();
    setRepayError('');
    setRepaySuccess('');

    const payload = {
      clearAll,
      paymentMethod: repaymentMethod
    };

    if (!clearAll) {
      const amt = Number(repaymentAmount);
      if (isNaN(amt) || amt <= 0) {
        setRepayError('Please enter a valid repayment amount greater than 0.');
        return;
      }
      payload.amountPaid = amt;
    }

    try {
      const res = await api.put(`/customers/${selectedCustomer._id}/debt`, payload);
      
      // Update states locally
      setSelectedCustomer(res.data);
      setRepaymentAmount('');
      setRepaySuccess(clearAll ? 'Debt cleared successfully!' : `Repayment of ₹${payload.amountPaid} recorded successfully!`);
      
      // Refresh customer list
      fetchCustomers();
      
      // Refresh transactions timeline
      const transRes = await api.get(`/transactions?customer=${selectedCustomer._id}`);
      setInvoices(transRes.data);
    } catch (err) {
      // Gracefully catch backend validations
      setRepayError(err.response?.data?.message || 'Repayment failed.');
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

  const getCreditLimit = (risk) => {
    switch (risk) {
      case 'High': return 1500;
      case 'Medium': return 5000;
      case 'Low': return 10000;
      default: return 3000;
    }
  };

  const creditLimit = selectedCustomer ? getCreditLimit(selectedCustomer.risk_category) : 0;
  const isOverLimit = selectedCustomer ? selectedCustomer.total_outstanding_debt >= creditLimit : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <Users className="text-brand-muted" size={24} /> Customers Matrix
          </h1>
          <p className="text-sm text-brand-muted mt-1">Monitor credit profiles, debts, and transaction histories</p>
        </div>
        <input 
          type="text" 
          placeholder="Search phone number..." 
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Outstanding Debt</th>
                <th className="px-6 py-4">ML Risk Profile</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-brand-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => handleRowClick(c)}>
                    <td className="px-6 py-4 font-medium text-brand-text">{c.name}</td>
                    <td className="px-6 py-4 text-brand-muted">{c.phone}</td>
                    <td className="px-6 py-4 font-semibold text-brand-text">₹{c.total_outstanding_debt}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(c.risk_category)}`}>
                        {c.risk_category === 'High' ? '🔴 High' : c.risk_category === 'Medium' ? '🟡 Medium' : c.risk_category === 'Low' ? '🟢 Low' : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-muted hover:text-brand-text p-2 hover:bg-gray-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center ml-auto">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Customer Profile Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-brand-text">{selectedCustomer.name}</h3>
                <p className="text-xs text-brand-muted mt-0.5">Phone: {selectedCustomer.phone} | Age: {selectedCustomer.age || 'N/A'}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Credit Limits Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-bg p-4 rounded-xl border border-gray-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-brand-muted">Outstanding Debt</p>
                <p className={`text-xl font-black ${selectedCustomer.total_outstanding_debt > 0 ? 'text-brand-red-text' : 'text-brand-muted'}`}>
                  ₹{selectedCustomer.total_outstanding_debt}
                </p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-gray-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-brand-muted">ML Credit Limit Cap</p>
                <p className="text-xl font-black text-brand-text">₹{creditLimit}</p>
                <span className="text-[10px] text-brand-muted">Based on {selectedCustomer.risk_category} Risk Rating</span>
              </div>
            </div>

            {/* Hard-Stop Credit Ceiling Alert */}
            {isOverLimit && (
              <div className="bg-brand-red-bg border border-brand-red-text/20 p-4 rounded-xl flex gap-3 items-center">
                <AlertCircle className="text-brand-red-text shrink-0" size={20} />
                <div>
                  <h4 className="text-brand-red-text font-bold text-xs">Credit Limit Exceeded!</h4>
                  <p className="text-[10px] text-brand-red-text/80 mt-0.5">
                    This customer's outstanding balance of ₹{selectedCustomer.total_outstanding_debt} is at or above their safety limit of ₹{creditLimit}. No further purchases on credit should be allowed.
                  </p>
                </div>
              </div>
            )}

            {/* Debt Repayment Form Section */}
            {selectedCustomer.total_outstanding_debt > 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-brand-green-text" /> Record Repayment
                </h4>
                
                {repayError && (
                  <p className="text-xs font-semibold text-brand-red-text bg-brand-red-bg p-2.5 rounded-lg">
                    {repayError}
                  </p>
                )}
                {repaySuccess && (
                  <p className="text-xs font-semibold text-brand-green-text bg-brand-green-bg p-2.5 rounded-lg">
                    {repaySuccess}
                  </p>
                )}

                <form onSubmit={(e) => handleRepayment(e, false)} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      placeholder="Amount to repay (₹)"
                      required
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none min-h-[44px]"
                      value={repaymentAmount}
                      onChange={(e) => setRepaymentAmount(e.target.value)}
                    />
                    <select
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none min-h-[44px]"
                      value={repaymentMethod}
                      onChange={(e) => setRepaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-brand-text text-brand-surface font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 min-h-[44px]"
                    >
                      Pay Amount
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-brand-muted">Or clear all pending liabilities:</span>
                    <button
                      type="button"
                      onClick={(e) => handleRepayment(e, true)}
                      className="text-brand-red-text font-bold hover:underline min-h-[32px] px-2"
                    >
                      Clear All Debt (₹{selectedCustomer.total_outstanding_debt})
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
                <ShoppingBag size={14} /> Itemized Invoice & Payment History
              </h4>
              
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {invoices.length === 0 ? (
                  <p className="text-xs text-brand-muted py-4 text-center">No transactions recorded for this customer.</p>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv._id} className="p-3 border border-gray-100 rounded-xl space-y-2 hover:border-gray-200 transition-colors">
                      {inv.is_repayment ? (
                        <div className="flex justify-between items-start text-xs">
                          <div className="space-y-1">
                            <span className="flex items-center gap-1 text-[10px] text-brand-muted">
                              <Calendar size={10} /> {new Date(inv.automated_timestamp).toLocaleString()}
                            </span>
                            <p className="font-bold text-brand-green-text flex items-center gap-1">
                              <CheckCircle size={14} /> Debt Repayment: ₹{inv.total_cost}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-green-bg text-brand-green-text">
                              Repaid
                            </span>
                            <p className="text-[10px] text-brand-muted">via {inv.payment_method}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start text-xs">
                            <div className="space-y-1">
                              <span className="flex items-center gap-1 text-[10px] text-brand-muted">
                                <Calendar size={10} /> {new Date(inv.automated_timestamp).toLocaleString()}
                              </span>
                              <p className="font-bold text-brand-text">Total Bill: ₹{inv.total_cost}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                inv.payment_status === 'Paid' ? 'bg-brand-green-bg text-brand-green-text' : 'bg-brand-red-bg text-brand-red-text'
                              }`}>
                                {inv.payment_status}
                              </span>
                              <p className="text-[10px] text-brand-muted">via {inv.payment_method}</p>
                            </div>
                          </div>
                          
                          {/* Sub-item names list */}
                          <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1 text-brand-muted border border-gray-100">
                            {inv.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span>
                                  {item.inventory_item?.item_name || item.item_name_snapshot || 'Deleted Product'}
                                </span>
                                <span>
                                  {item.quantity} units @ ₹{item.price_at_checkout}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
