import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Checkout', icon: ShoppingCart, path: '/checkout' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-brand-surface border-t border-gray-100 flex justify-around p-2 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-lg min-w-[44px] min-h-[44px] justify-center ${
              isActive ? 'text-brand-text font-semibold' : 'text-brand-muted'
            }`
          }
        >
          <item.icon size={24} />
          <span className="text-[10px] mt-1">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
