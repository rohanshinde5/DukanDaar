import { useState, useEffect } from 'react';
import api, { mlApi } from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState({
    targetSales: 0,
    collectibleDebt: 0,
    salesTillToday: 0 // Mocked or calculated from transactions
  });
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [wholesalersRes, customersRes] = await Promise.all([
          api.get('/wholesalers'),
          api.get('/customers?limit=1000') // In prod, we'd have a specific aggregator endpoint
        ]);

        const target = wholesalersRes.data.reduce((acc, curr) => acc + curr.upcoming_dues, 0);
        const debt = customersRes.data.reduce((acc, curr) => acc + curr.total_outstanding_debt, 0);

        setData({ targetSales: target, collectibleDebt: debt, salesTillToday: 12500 }); // 12500 is mock for today

        // Fetch ML Forecast
        const mlRes = await mlApi.post('/cash-forecast', {
          monthly_repayment_speed: 10000, // mock speed
          upcoming_wholesaler_dues: target
        });
        setForecast(mlRes.data);

      } catch (error) {
        console.error("Dashboard fetch error", error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
      
      {forecast?.alert && (
        <div className="bg-brand-red-bg border border-brand-red-text/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-brand-red-text font-bold">Predicted Cash Deficit Alert</h3>
            <p className="text-brand-red-text/80 text-sm mt-1">
              Deficit of ₹{forecast.predicted_cash_deficit}. Wholesaler dues exceed expected incoming cash.
            </p>
          </div>
        </div>
      )}
      
      {forecast && !forecast.alert && (
        <div className="bg-brand-green-bg border border-brand-green-text/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-brand-green-text font-bold">Safe Cash Margin</h3>
            <p className="text-brand-green-text/80 text-sm mt-1">
              Safety margin of ₹{forecast.safety_margin}. You are well positioned for wholesaler dues.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-brand-muted">Sales Till Today</p>
          <p className="text-3xl font-bold text-brand-text mt-2">₹{data.salesTillToday}</p>
        </div>
        <div className="bg-brand-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-brand-muted">Target Sales (Wholesaler Dues)</p>
          <p className="text-3xl font-bold text-brand-text mt-2">₹{data.targetSales}</p>
        </div>
        <div className="bg-brand-surface p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-brand-muted">Total Collectible Debt</p>
          <p className="text-3xl font-bold text-brand-text mt-2">₹{data.collectibleDebt}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
