import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home, User, Wrench, Settings } from 'lucide-react';

const Navigation = ({ currentScreen, onNavigate, onLogout, username }) => {
  const navigationItems = [
    { id: 'menu', label: 'Inicio', icon: Home },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'equipo', label: 'Equipo', icon: Wrench },
    { id: 'operacion', label: 'Operación', icon: Settings },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/Logo_imcyc.png" 
              alt="Logo IMCYC" 
              className="h-12 w-auto" 
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-800">IMCYC</span>
              <p className="text-sm text-gray-600">Sistema de Evaluación</p>
            </div>
          </div>

          {/* Navegación central */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id || 
                (currentScreen === 'evaluation' && item.id !== 'menu') ||
                (currentScreen === 'results' && item.id !== 'menu');
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center space-x-4">
            {username && (
              <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                {username}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id || 
                (currentScreen === 'evaluation' && item.id !== 'menu') ||
                (currentScreen === 'results' && item.id !== 'menu');
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;