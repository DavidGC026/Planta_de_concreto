import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Shield, UserCheck, Settings, ClipboardCheck } from 'lucide-react';
import AdminPermissionsPanel from '@/components/AdminPermissionsPanel';
import apiService from '@/services/api';
import permissionsService from '@/services/permissionsService';
import { IMAGES } from '@/utils/paths';

const MainMenu = ({ onSelectEvaluation, onShowBlockedScreen }) => {
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState(null);
  
  React.useEffect(() => {
    const loadUserData = async () => {
      const user = apiService.getCurrentUser();
      setIsAdmin(user && user.rol === 'admin');
      
      if (user) {
        try {
          const permissions = await permissionsService.getPermissionsInfo(user.id);
          setUserPermissions(permissions);
        } catch (error) {
          console.error('Error loading user permissions:', error);
        }
      }
    };
    
    loadUserData();
  }, []);
  
  if (showAdminPanel) {
    return <AdminPermissionsPanel onBack={() => setShowAdminPanel(false)} />;
  }

  const evaluationTypes = [
    {
      id: 'personal',
      title: 'Evaluación de Personal',
      icon: UserCheck,
      description: 'Evaluar competencias del personal',
      enabled: userPermissions?.canEvaluatePersonal || isAdmin
    },
    {
      id: 'equipo',
      title: 'Evaluación de Equipo',
      icon: Settings,
      description: 'Evaluar estado de equipos',
      enabled: userPermissions?.canEvaluateEquipo || isAdmin
    },
    {
      id: 'operacion',
      title: 'Evaluación de Operación',
      icon: ClipboardCheck,
      description: 'Evaluar procesos operativos',
      enabled: userPermissions?.canEvaluateOperacion || isAdmin
    }
  ];

  const handleEvaluationSelect = async (evaluationType) => {
    // Verificar permisos antes de permitir acceso
    const user = apiService.getCurrentUser();
    if (!user) return;

    try {
      // Primero verificar si el usuario puede realizar exámenes (no está bloqueado)
      const examAccess = await apiService.verificarAccesoExamen(user.id);
      
      if (!examAccess.puede_realizar_examenes) {
        // Si está bloqueado, mostrar pantalla de bloqueo
        onShowBlockedScreen();
        return;
      }
      
      // Luego verificar permisos específicos del tipo de evaluación
      const hasAccess = await permissionsService.checkEvaluationAccess(user.id, evaluationType);
      
      if (!hasAccess && !isAdmin) {
        alert('No tienes permisos para realizar este tipo de evaluación. Contacta al administrador.');
        return;
      }
      
      onSelectEvaluation(evaluationType);
    } catch (error) {
      console.error('Error checking evaluation access:', error);
      alert('Error al verificar permisos. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen custom-bg flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-700/10"></div>
      
      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistema de Evaluación IMCYC
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona el tipo de evaluación que deseas realizar
          </p>
          
          {/* Mostrar información de permisos si es usuario restringido */}
          {userPermissions?.restrictedAccess && (
            <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg inline-block">
              <p className="text-sm">
                <strong>Acceso Restringido:</strong> Solo puedes realizar las evaluaciones para las que tienes permisos asignados.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div 
          className="w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {evaluationTypes.map((type, index) => {
            const IconComponent = type.icon;
            
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                whileHover={{ scale: type.enabled ? 1.03 : 1 }}
                whileTap={{ scale: type.enabled ? 0.98 : 1 }}
              >
                <Button
                  variant="list"
                  size="lg"
                  onClick={() => type.enabled && handleEvaluationSelect(type.id)}
                  disabled={!type.enabled}
                  className={`w-full font-semibold py-6 rounded-lg text-lg justify-start pl-8 ${
                    type.enabled 
                      ? 'button-list-item hover:shadow-lg transition-all duration-200' 
                      : 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500'
                  }`}
                >
                  <IconComponent className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">{type.title}</div>
                    <div className="text-sm font-normal text-gray-600">{type.description}</div>
                  </div>
                  {!type.enabled && (
                    <div className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      Sin permisos
                    </div>
                  )}
                </Button>
              </motion.div>
            );
          })}
          
          {/* Panel de administración para admins */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + evaluationTypes.length * 0.15 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAdminPanel(true)}
                className="w-full font-semibold py-6 rounded-lg text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 justify-start pl-8"
              >
                <Shield className="w-5 h-5 mr-3" />
                Panel de Permisos de Usuario
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Concreton */}
      <motion.div
        initial={{ opacity: 0, x: 100, y:50 }}
        animate={{ opacity: 1, x: 0, y:0 }}
        transition={{ duration: 1.2, delay: 0.8, type: "spring", stiffness: 50 }}
        className="fixed bottom-0 right-0 md:right-5 z-20 pointer-events-none"
      >
        <img   
          alt="Concreton - Mascota IMCYC"
          className="w-32 h-40 drop-shadow-2xl"
          src={IMAGES.CONCRETON}
        />
      </motion.div>
    </div>
  );
};

export default MainMenu;