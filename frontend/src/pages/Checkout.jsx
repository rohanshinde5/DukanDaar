import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';

const Checkout = () => {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        api.get(`/inventory?search=${searchTerm}`).then(res => setSearchResults(res.data));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchCustomer = async () => {
    try {
      const res = await api.get(`/customers?search=${phone}`);
      if (res.data.length > 0) {
        setCustomer(res.data[0]);
      } else {
        setCustomer({ name: 'New Customer', phone });
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
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c._id !== id));
  };

  const total = cart.reduce((acc, curr) => acc + (curr.selling_price * curr.cartQty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        customerId: customer?._id,
        items: cart.map(c => ({ inventory_item: c._id, quantity: c.cartQty })),
        payment_status: paymentStatus,
        payment_method: paymentMethod
      };
      await api.post('/transactions', payload);
      setAlert('Transaction successful!');
      setCart([]);
      setCustomer(null);
      setPhone('');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Transaction failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
      {/* Left side: Products search & Customer */}
      <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
        <h1 className="text-2xl font-bold text-brand-text">Checkout</h1>
        
        {alert && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${alert.includes('successful') ? 'bg-brand-green-bg text-brand-green-text' : 'bg-brand-red-bg text-brand-red-text'}`}>
            {alert}
          </div>
        )}

        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Customer Phone" 
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={searchCustomer} className="px-4 bg-brand-surface border border-gray-200 rounded-xl hover:bg-gray-50 min-h-[44px]">Search</button>
        </div>

        {customer && (
          <div className="p-4 bg-brand-surface rounded-xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-semibold text-brand-text">{customer.name}</p>
              <p className="text-xs text-brand-muted">{customer.phone}</p>
            </div>
            {customer.risk_category && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${customer.risk_category === 'High' ? 'bg-brand-red-bg text-brand-red-text' : customer.risk_category === 'Medium' ? 'bg-brand-yellow-bg text-brand-yellow-text' : 'bg-brand-green-bg text-brand-green-text'}`}>
                Risk: {customer.risk_category}
              </span>
            )}
          </div>
        )}

        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-gray-100 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
              {searchResults.map(item => (
                <div key={item._id} onClick={() => addToCart(item)} className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex justify-between">
                  <div>
                    <p className="font-medium text-brand-text">{item.item_name}</p>
                    <p className="text-xs text-brand-muted">Stock: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{item.selling_price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart */}
      <div className="bg-brand-surface rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full overflow-y-auto">
        <h2 className="text-lg font-bold text-brand-text mb-4">Current Order</h2>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.map(item => (
            <div key={item._id} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{item.item_name}</p>
                <p className="text-xs text-brand-muted">₹{item.selling_price} x {item.cartQty}</p>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-sm mr-2">₹{item.selling_price * item.cartQty}</p>
                <button onClick={() => removeFromCart(item._id)} className="text-brand-red-text p-1"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select 
              value={paymentStatus} 
              onChange={e => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none min-h-[44px]"
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid/Debt">Unpaid / Debt</option>
            </select>
            <select 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none min-h-[44px]"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-brand-text text-white py-3 rounded-xl font-semibold disabled:opacity-50 min-h-[44px]"
          >
            Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
