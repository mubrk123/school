import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  CreditCard, 
  CheckSquare, 
  Bell, 
  UserCog,
  LogOut,
  Menu,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout = ({ children }) => {
  const { user, school, logout, isPrincipal, isTeacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard,
      access: 'all'
    },
    { 
      name: 'Students', 
      href: '/students', 
      icon: Users,
      access: 'principal'
    },
    { 
      name: 'Admission', 
      href: '/students/new', 
      icon: UserPlus,
      access: 'principal'
    },
    { 
      name: 'Teachers', 
      href: '/teachers', 
      icon: UserCog,
      access: 'principal'
    },
    { 
      name: 'Fee Management', 
      href: '/fees', 
      icon: CreditCard,
      access: 'principal'
    },
    { 
      name: 'Attendance', 
      href: '/attendance', 
      icon: CheckSquare,
      access: 'all'
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell,
      access: 'principal'
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.access === 'all') return true;
    if (item.access === 'principal' && isPrincipal) return true;
    return false;
  });

  const NavContent = ({ onItemClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Scholify</h1>
            <p className="text-xs text-slate-500 truncate max-w-[140px]">{school?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-slate-600 font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-slate-600 border-slate-200 hover:text-red-600 hover:border-red-200"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-slate-200">
        <NavContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Scholify</h1>
              <p className="text-xs text-slate-500 truncate max-w-[150px]">{school?.name}</p>
            </div>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent onItemClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-24 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};
