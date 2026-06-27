import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, Truck, BookOpen } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard',   icon: LayoutDashboard, path: '/'           },
    { name: 'Checkout',    icon: ShoppingCart,    path: '/checkout'   },
    { name: 'Customers',   icon: Users,           path: '/customers'  },
    { name: 'Inventory',   icon: Package,         path: '/inventory'  },
    { name: 'Wholesalers', icon: Truck,           path: '/wholesalers'},
    { name: 'Diary',       icon: BookOpen,        path: '/diary'      },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-brand-surface border-r border-gray-100 h-screen sticky top-0">
      <div className="p-6 text-2xl font-bold text-brand-text">DukanDaar</div>
      <div className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive ? 'bg-brand-bg text-brand-text font-semibold' : 'text-brand-muted hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
      <div className="p-4">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-brand-red-text hover:bg-brand-red-bg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
