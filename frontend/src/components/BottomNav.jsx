import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, Truck, BookOpen } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Home',        icon: LayoutDashboard, path: '/'           },
    { name: 'Checkout',    icon: ShoppingCart,    path: '/checkout'   },
    { name: 'Customers',   icon: Users,           path: '/customers'  },
    { name: 'Inventory',   icon: Package,         path: '/inventory'  },
    { name: 'Suppliers',   icon: Truck,           path: '/wholesalers'},
    { name: 'Diary',       icon: BookOpen,        path: '/diary'      },
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
          <item.icon size={20} />
          <span className="text-[9px] mt-0.5">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
