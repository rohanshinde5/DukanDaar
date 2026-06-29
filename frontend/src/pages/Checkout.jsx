import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Minus, Trash2, RefreshCw } from 'lucide-react';

const Checkout = () => {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inStockProducts, setInStockProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [alert, setAlert] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    age: ''
  });

  useEffect(() => {
    fetchInStockCatalog();
  }, []);

  const fetchInStockCatalog = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/inventory?limit=100'); // Fetch a large batch of active inventory
      // Filter in-stock and non-expired products
      const filtered = res.data.filter(item => {
        const isNotExpired = new Date(item.expiry_date) >= new Date();
        const isInStock = item.quantity > 0;
        return isNotExpired && isInStock;
      });
      setInStockProducts(filtered);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createCustomer = async () => {
    try {
      const res = await api.post('/customers', newCustomerData);
      setCustomer(res.data);
      setIsNewCustomer(false);
      setAlert('Customer created successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const searchCustomer = async () => {
    if (!phone) return;
    try {
      const res = await api.get(`/customers?search=${phone}`);
      if (res.data.length > 0) {
        setCustomer(res.data[0]);
        setIsNewCustomer(false);
      } else {
        setCustomer(null);
        setIsNewCustomer(true);
        setNewCustomerData({ name: '', phone, age: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (item) => {
    setAlert(null);
    if (new Date(item.expiry_date) < new Date()) {
      setAlert(`Cannot add ${item.item_name}. Product is EXPIRED.`);
      return;
    }
    if (item.quantity <= 0) {
      setAlert(`Product Not Available: ${item.item_name} is out of stock.`);
      return;
    }
    
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      if (existing.cartQty >= item.quantity) {
        setAlert(`Cannot add more ${item.item_name}. Stock limit reached.`);
        return;
      }
      setCart(cart.map(c => c._id === item._id ? { ...c, cartQty: c.cartQty + 1 } : c));
    } else {
      setCart([...cart, { ...item, cartQty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c._id !== id));
  };

  const total = cart.reduce((acc, curr) => acc + (curr.selling_price * curr.cartQty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // ML credit limit guardrail check (frontend block)
    if (paymentStatus === 'Unpaid/Debt' && customer) {
      const limit = customer.risk_category === 'High' ? 1500 : customer.risk_category === 'Medium' ? 5000 : 10000;
      if (customer.total_outstanding_debt + total > limit) {
        setAlert(`Hard-Stop Block: Checkout exceeds customer's credit cap of ₹${limit}.`);
        return;
      }
    }

    try {
      const payload = {
        customerId: customer?._id,
        items: cart.map(c => ({ inventory_item: c._id, quantity: c.cartQty })),
        payment_status: paymentStatus,
        payment_method: paymentMethod
      };
      await api.post('/transactions', payload);
      setAlert('Transaction completed successfully!');
      setCart([]);
      setCustomer(null);
      setPhone('');
      // Refresh in-stock catalog to reflect decremented quantities
      fetchInStockCatalog();
    } catch (err) {
      setAlert(err.response?.data?.message || 'Transaction failed');
    }
  };

  // Filter the catalog locally in real-time
  const filteredProducts = inStockProducts.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)] h-auto pb-10 lg:pb-0">
      {/* Left side: Products search & Customer */}
      <div className="lg:col-span-2 space-y-4 flex flex-col lg:h-full h-auto">
        <h1 className="text-2xl font-bold text-brand-text">Checkout (POS)</h1>
        
        {alert && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${
            alert.includes('successful') || alert.includes('created') ? 'bg-brand-green-bg text-brand-green-text' : 'bg-brand-red-bg text-brand-red-text'
          }`}>
            {alert}
          </div>
        )}

        {/* Customer Lookup */}
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Customer Phone" 
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={searchCustomer} className="px-4 bg-brand-surface border border-gray-200 rounded-xl hover:bg-gray-50 min-h-[44px]">Search</button>
        </div>

        {customer && (
          <div className="p-4 bg-brand-surface rounded-xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-semibold text-brand-text">{customer.name}</p>
              <p className="text-xs text-brand-muted">Phone: {customer.phone} | Unpaid Debt: ₹{customer.total_outstanding_debt}</p>
            </div>
            {customer.risk_category && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                customer.risk_category === 'High' ? 'bg-brand-red-bg text-brand-red-text' : customer.risk_category === 'Medium' ? 'bg-brand-yellow-bg text-brand-yellow-text' : 'bg-brand-green-bg text-brand-green-text'
              }`}>
                Risk: {customer.risk_category}
              </span>
            )}
          </div>
        )}

        {isNewCustomer && (
          <div className="p-4 bg-brand-surface rounded-xl border border-gray-100 space-y-3">
            <h3 className="font-semibold text-sm">Register New Customer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              />
              <input
                type="number"
                placeholder="Age"
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none"
                value={newCustomerData.age}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, age: e.target.value })}
              />
            </div>
            <button
              onClick={createCustomer}
              disabled={!newCustomerData.name}
              className="bg-brand-text text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 min-h-[36px]"
            >
              Create Customer
            </button>
          </div>
        )}

        {/* Product Catalog Display with Search */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchInStockCatalog}
              disabled={isRefreshing}
              className="p-3 bg-brand-surface border border-gray-200 rounded-xl hover:bg-gray-50 min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted hover:text-brand-text disabled:opacity-50"
              title="Refresh in-stock list"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 lg:overflow-y-auto pr-1 min-h-[350px] lg:min-h-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-3">Available Products</h3>
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-brand-muted py-8 text-center">No in-stock products found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {filteredProducts.map(item => (
                  <div
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className="p-4 bg-brand-surface border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-brand-text text-sm">{item.item_name}</p>
                      <p className="text-[10px] text-brand-muted mt-1">Stock: {item.quantity} units</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-text">₹{item.selling_price}</p>
                      <span className="text-[9px] text-brand-muted">₹{item.cost_price} cost</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Cart */}
      <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col lg:h-full h-auto mt-6 lg:mt-0">
        <h2 className="text-lg font-bold text-brand-text mb-4">Current Order</h2>
        
        <div className="flex-1 lg:overflow-y-auto space-y-4 pr-1 max-h-[300px] lg:max-h-none min-h-[100px]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-muted text-xs">
              <p>Order cart is empty</p>
              <p className="text-[10px] opacity-75 mt-1">Click product cards on the left to add items</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-xs text-brand-text">{item.item_name}</p>
                  <p className="text-[10px] text-brand-muted mt-0.5">₹{item.selling_price} x {item.cartQty}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-xs text-brand-text mr-1">₹{item.selling_price * item.cartQty}</p>
                  <button onClick={() => removeFromCart(item._id)} className="text-brand-red-text p-1 hover:bg-brand-red-bg/50 rounded"><Trash2 size={14}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 shrink-0">
          <div className="flex justify-between font-bold text-base">
            <span>Total Bill</span>
            <span>₹{total}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select 
              value={paymentStatus} 
              onChange={e => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none min-h-[44px]"
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid/Debt">Unpaid / Debt</option>
            </select>
            <select 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none min-h-[44px]"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-brand-text text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 min-h-[44px] hover:opacity-95"
          >
            Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
