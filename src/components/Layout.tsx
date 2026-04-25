import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardCheck, 
  Wallet, 
  LineChart, 
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Waves,
  Briefcase,
  ChevronRight,
  Bell,
  Megaphone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { AppSettings } from '../types';

export const Layout: React.FC = () => {
  const { profile, logout, activeBusinessLine, setActiveBusinessLine } = useAuth();
  const { settings: appSettings } = useSettings();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'teacher', 'parent'] },
    { name: 'Siswa', path: '/students', icon: Users, roles: ['admin', 'teacher'] },
    { name: 'Jadwal', path: '/schedule', icon: Calendar, roles: ['admin', 'teacher', 'parent'] },
    { name: 'Kehadiran', path: '/attendance', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { name: 'Financials', path: '/financials', icon: Wallet, roles: ['admin', 'parent'] },
    { name: 'Progress', path: '/progress', icon: LineChart, roles: ['admin', 'teacher', 'parent'] },
    { name: 'Info', path: '/announcements', icon: Megaphone, roles: ['admin', 'teacher', 'parent'] },
    { name: 'Users', path: '/users', icon: ShieldCheck, roles: ['admin'] },
    { name: 'Pengaturan', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 overflow-hidden"
            style={!appSettings.appLogoUrl ? { backgroundColor: appSettings.themeColor } : {}}
          >
            {appSettings.appLogoUrl ? (
              <img src={appSettings.appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
               <span className="text-white font-black text-lg">E</span>
            )}
          </div>
          <span className="font-black text-gray-900 tracking-tight">{appSettings.appName}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-50 rounded-xl text-gray-600 transition-all active:scale-90"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar / Overlay menu */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col md:relative md:translate-x-0"
            >
              {/* Branding Section */}
              <div className="p-8 hidden md:block">
                <Link to="/" className="flex items-center gap-4 group">
                  <div 
                    className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:rotate-6 overflow-hidden"
                    style={!appSettings.appLogoUrl ? { backgroundColor: appSettings.themeColor } : {}}
                  >
                    {appSettings.appLogoUrl ? (
                      <img src={appSettings.appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-xl">E</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900 tracking-tighter leading-none">{appSettings.appName}</h1>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">CasaOS Mode</p>
                  </div>
                </Link>
              </div>

              {/* Navigation Section */}
              <nav className="flex-1 px-6 space-y-1.5 py-4 overflow-y-auto">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 px-4">Menu Utama</p>
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all group relative",
                        isActive 
                          ? "text-white shadow-xl" 
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      style={isActive ? { backgroundColor: appSettings.themeColor, boxShadow: `0 20px 25px -5px ${appSettings.themeColor}33` } : {}}
                    >
                      <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400")} />
                      <span className="font-bold text-sm tracking-tight">{item.name}</span>
                      {isActive && (
                         <motion.div layoutId="nav-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </Link>
                  );
                })}

                {/* Business Line Toggle */}
                {(profile?.role === 'admin' || (profile?.role === 'teacher' && profile?.businessLine === 'both')) && (
                  <div className="mt-10 mb-6">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 px-4">Filter Bisnis</p>
                    <div className="grid grid-cols-1 gap-2 p-2 bg-gray-50 rounded-[1.75rem]">
                      <button 
                        onClick={() => setActiveBusinessLine('shadow')}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                          activeBusinessLine === 'shadow' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Shadow</span>
                        </div>
                        {activeBusinessLine === 'shadow' && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => setActiveBusinessLine('swimming')}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                          activeBusinessLine === 'swimming' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Waves className="w-3.5 h-3.5" />
                          <span>Renang</span>
                        </div>
                        {activeBusinessLine === 'swimming' && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => setActiveBusinessLine('both')}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                          activeBusinessLine === 'both' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                        )}
                      >
                         <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Semua</span>
                        </div>
                        {activeBusinessLine === 'both' && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </nav>

              {/* User Account Section */}
              <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                <div className="space-y-2">
                   <Link 
                    to="/profile" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl transition-all group",
                      location.pathname === '/profile' ? "bg-white shadow-sm border border-gray-100" : "hover:bg-gray-100/50"
                    )}
                   >
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.displayName}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate tracking-tight">{profile?.displayName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile?.role}</p>
                      </div>
                      <Settings className="w-4 h-4 text-gray-300 group-hover:rotate-90 transition-transform" />
                   </Link>

                   <button 
                    onClick={() => logout()}
                    className="flex items-center gap-4 w-full p-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm tracking-tight"
                   >
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                        <LogOut className="w-5 h-5" />
                     </div>
                     <span>Keluar</span>
                   </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 px-12 items-center justify-between sticky top-0 z-30 hidden md:flex">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-inner">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Server Lokal Aktif</span>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <button className="relative p-2.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors group">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
             </button>
             
             <div className="h-6 w-px bg-gray-200" />
             
             <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="text-right">
                   <p className="text-sm font-black text-gray-900 tracking-tight leading-none">{profile?.displayName}</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lihat Profil</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 p-0.5 shadow-sm overflow-hidden transform hover:scale-105 transition-transform duration-300">
                   <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.displayName}`} 
                    alt="User" 
                    className="w-full h-full object-cover rounded-[0.85rem]" 
                   />
                </div>
             </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-12 pb-24 md:pb-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center z-50 px-4">
        {filteredNavItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all relative overflow-hidden",
                isActive ? "text-white" : "text-gray-400"
              )}
              style={isActive ? { backgroundColor: appSettings.themeColor } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.name}</span>
              {isActive && (
                 <motion.div 
                   layoutId="mobile-active" 
                   className="absolute inset-0 bg-white/10" 
                 />
              )}
            </Link>
          );
        })}
        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all",
            location.pathname === '/profile' ? "bg-gray-100 text-gray-900" : "text-gray-400"
          )}
        >
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.displayName}`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Profil</span>
        </Link>
      </div>
    </div>
  );
};
