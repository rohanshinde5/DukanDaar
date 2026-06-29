import { Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CalculatorWidget from './CalculatorWidget';
import { LogOut } from 'lucide-react';

const Layout = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-brand-bg overflow-hidden">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-brand-surface border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/dukandaar_logo.png" alt="DukanDaar Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-xl font-bold text-brand-text">DukanDaar</span>
        </div>
        <button
          onClick={logout}
          className="p-2 text-brand-red-text hover:bg-brand-red-bg/50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
      <BottomNav />
      {/* Floating calculator — available on every page */}
      <CalculatorWidget />
    </div>
  );
};

export default Layout;
