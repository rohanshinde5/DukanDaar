import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CalculatorWidget from './CalculatorWidget';

const Layout = () => {
  return (
    <div className="flex h-screen bg-brand-bg">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
      <BottomNav />
      {/* Floating calculator — available on every page */}
      <CalculatorWidget />
    </div>
  );
};

export default Layout;
