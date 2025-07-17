import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Shield } from 'lucide-react';
import apiService from '@/services/api';

const Navigation = ({ currentScreen, currentEvaluation, onNavigate, onLogout, username }) => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    const user = apiService.getCurrentUser();
    setIsAdmin(user && user.rol === 'admin');
  }, []);

  // Función para manejar clics de navegación - SIEMPRE permite navegación
  const handleNavigationClick = (itemId) => {
    console.log('Navigation click:', itemId); // Debug log
    onNavigate(itemId);
  };

  // Función para manejar logout - SIEMPRE permite logout
  const handleLogoutClick = () => {
    console.log('Logout click'); // Debug log
    onLogout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
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
              <p className="text-sm text-gray-600">Plantas de Concreto</p>
            </div>
          </div>

          {/* Navegación simplificada - Solo Inicio y Salir */}
          <div className="flex items-center space-x-4">
            {/* Botón de Inicio */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigationClick('menu')}
              className="flex items-center space-x-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </Button>

            {/* Usuario (si está disponible) */}
            {username && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                  {username}
                </span>
                {!isAdmin && (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    <Shield className="w-3 h-3" />
                    <span className="hidden md:inline">Acceso Restringido</span>
                  </div>
                )}
              </div>
            )}

            {/* Botón de Salir */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              className="flex items-center space-x-2 border-red-600 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;