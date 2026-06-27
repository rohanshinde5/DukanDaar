import { useState, useEffect, useCallback } from 'react';
import api, { mlApi } from '../services/api';
import {
  TrendingUp, AlertTriangle, CheckCircle, ShoppingCart,
  RefreshCw, Calendar, BarChart2, DollarSign, Users
} from 'lucide-react';

// ── Pure-CSS mini bar chart ────────────────────────────────────────────────
const SalesBarChart = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-brand-muted text-sm">
        No sales data yet for this period.
      </div>
    );
  }

  const maxSales = Math.max(...history.map(h => h.totalSales), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-28">
        {history.map((m, idx) => {
          const pct = (m.totalSales / maxSales) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {m.label}: ₹{m.totalSales.toLocaleString('en-IN')}
                <br />{m.transactionCount} transactions
              </div>
              {/* Bar */}
              <div className="w-full rounded-t-md transition-all duration-500 relative"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: m.isCurrent
                    ? 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(180deg, #d1d5db 0%, #e5e7eb 100%)',
                  minHeight: '4px'
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Month labels */}
      <div className="flex items-center gap-2">
        {history.map((m, idx) => (
          <div key={idx} className={`flex-1 text-center text-[9px] font-semibold truncate ${m.isCurrent ? 'text-indigo-600' : 'text-brand-muted'}`}>
            {m.label.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'text-brand-text', bg = 'bg-brand-surface' }) => (
  <div className={`${bg} p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3`}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{label}</p>
      <div className="p-2 bg-gray-50 rounded-xl">
        <Icon size={16} className="text-brand-muted" />
      </div>
    </div>
    <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
    {sub && <p className="text-[11px] text-brand-muted">{sub}</p>}
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const [salesData, setSalesData] = useState(null);       // from /api/transactions/monthly-sales
  const [wholesalerDues, setWholesalerDues] = useState(0);
  const [collectibleDebt, setCollectibleDebt] = useState(0);
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [salesRes, wholesalersRes, customersRes] = await Promise.all([
        api.get('/transactions/monthly-sales'),
        api.get('/wholesalers'),
        api.get('/customers?limit=500')
      ]);

      setSalesData(salesRes.data);

      const dues = wholesalersRes.data.reduce((acc, w) => acc + (w.upcoming_dues || 0), 0);
      const debt = customersRes.data.reduce((acc, c) => acc + (c.total_outstanding_debt || 0), 0);
      setWholesalerDues(dues);
      setCollectibleDebt(debt);
      setLastUpdated(new Date());

      // ML cash-flow forecast
      try {
        const currentMonthSales = salesRes.data?.currentMonth?.totalSales || 0;
        const mlRes = await mlApi.post('/cash-forecast', {
          monthly_repayment_speed: currentMonthSales,
          upcoming_wholesaler_dues: dues
        });
        setForecast(mlRes.data);
      } catch {
        setForecast(null);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const currentMonth = salesData?.currentMonth;
  const history = salesData?.history || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading live data…'}
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-gray-200 rounded-xl text-sm font-medium text-brand-text hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ML Alert Banner */}
      {!isLoading && forecast?.alert && (
        <div className="bg-brand-red-bg border border-brand-red-text/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-brand-red-text shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-brand-red-text font-bold text-sm">Predicted Cash Deficit Alert</h3>
            <p className="text-brand-red-text/80 text-xs mt-0.5">
              Estimated deficit of {fmt(forecast.predicted_cash_deficit)}. Upcoming wholesaler dues exceed expected incoming cash from sales & debt recovery.
            </p>
          </div>
        </div>
      )}

      {!isLoading && forecast && !forecast.alert && (
        <div className="bg-brand-green-bg border border-brand-green-text/20 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-brand-green-text shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-brand-green-text font-bold text-sm">Cash Flow Healthy</h3>
            <p className="text-brand-green-text/80 text-xs mt-0.5">
              Safety margin of {fmt(forecast.safety_margin)}. You're well-positioned to cover upcoming wholesaler dues.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards row */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-brand-surface p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={ShoppingCart}
            label={`Sales — ${currentMonth?.label || 'This Month'}`}
            value={fmt(currentMonth?.totalSales)}
            sub={`${currentMonth?.transactionCount || 0} transaction${(currentMonth?.transactionCount || 0) !== 1 ? 's' : ''} this month`}
            color="text-indigo-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Target (Wholesaler Dues)"
            value={fmt(wholesalerDues)}
            sub="Total upcoming dues across all wholesalers"
          />
          <StatCard
            icon={Users}
            label="Collectible Customer Debt"
            value={fmt(collectibleDebt)}
            sub="Sum of all outstanding customer balances"
            color={collectibleDebt > 0 ? 'text-amber-600' : 'text-brand-text'}
          />
        </div>
      )}

      {/* 6-Month Sales History Chart */}
      <div className="bg-brand-surface border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-brand-muted" />
            <h2 className="text-sm font-bold text-brand-text">Monthly Sales — Last 6 Months</h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-brand-muted">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-indigo-500" /> Current month
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-gray-300" /> Previous months
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-36 animate-pulse bg-gray-50 rounded-xl" />
        ) : (
          <SalesBarChart history={history} />
        )}

        {/* Month details table */}
        {!isLoading && history.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {[...history].reverse().map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    m.isCurrent ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className={m.isCurrent ? 'text-indigo-500' : 'text-brand-muted'} />
                    <span className={`font-medium ${m.isCurrent ? 'text-indigo-700' : 'text-brand-text'}`}>
                      {m.label} {m.isCurrent && <span className="text-[10px] font-semibold text-indigo-500 ml-1">● Current</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-brand-muted text-xs">{m.transactionCount} txns</span>
                    <span className={`font-bold tabular-nums ${m.isCurrent ? 'text-indigo-700' : 'text-brand-text'}`}>
                      {fmt(m.totalSales)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick summary footer */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Months Tracked', value: history.length, icon: Calendar },
            { label: 'Total Sales (6M)', value: fmt(history.reduce((a, m) => a + m.totalSales, 0)), icon: DollarSign },
            { label: 'Total Transactions (6M)', value: history.reduce((a, m) => a + m.transactionCount, 0), icon: ShoppingCart },
            { label: 'Avg Monthly Sales', value: fmt(history.length ? history.reduce((a, m) => a + m.totalSales, 0) / history.length : 0), icon: TrendingUp },
          ].map((item, idx) => (
            <div key={idx} className="bg-brand-surface border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-brand-muted">
                <item.icon size={12} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-brand-text">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
