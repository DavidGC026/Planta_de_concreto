import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Shield } from 'lucide-react';
import permissionsService from '@/services/permissionsService';

const Navigation = ({ currentScreen, currentEvaluation, onNavigate, onLogout, username }) => {
  const [userPermissions, setUserPermissions] = React.useState(null);
  
  React.useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('imcyc_user') || '{}');
        if (user.id) {
          const permissions = await permissionsService.getPermissionsInfo(user.id);
          setUserPermissions(permissions);
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    };
    
    loadUserPermissions();
  }, []);

  // Función para manejar clics de navegación - SIEMPRE funcional
  const handleNavigationClick = (itemId) => {
    // Siempre permitir navegación al inicio
    onNavigate(itemId);
  };

  // Función para manejar logout - SIEMPRE funcional
  const handleLogoutClick = () => {
    // Siempre permitir logout
    onLogout();
  };

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
                {userPermissions?.restrictedAccess && (
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