import React, { useState, useEffect, useRef } from 'react';
import { IMAGES } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, ArrowRight, BarChart3, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import CalendarMaintenanceSystem from '@/components/CalendarMaintenanceSystem';
import SeguimientoCalibraciones from './SeguimientoCalibraciones';
import ViewPersonalResults from './ViewPersonalResults';
import ParametrosOperacion from './ParametrosOperacion';

const EvaluationScreenOperacion = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSeguimiento, setShowSeguimiento] = useState(false);
  const [showPersonalResults, setShowPersonalResults] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);
  const [showParametrosOperacion, setShowParametrosOperacion] = useState(false);

  useEffect(() => {
    // Verificar si el usuario es administrador
    const checkAdminStatus = async () => {
      try {
        const user = apiService.getCurrentUser();
        if (user && user.rol === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdminStatus();
  }, []);

  // Si se está mostrando el calendario, renderizar solo el calendario
  if (showCalendar) {
    return <CalendarMaintenanceSystem onBack={() => setShowCalendar(false)} />;
  }
  if (showSeguimiento) {
    return <SeguimientoCalibraciones />;
  }
if (showPersonalResults) {
    return <ViewPersonalResults onBack={() => setShowPersonalResults(false)} username={username} />;
  }
  if (showParametrosOperacion) {
    return <ParametrosOperacion onBack={() => setShowParametrosOperacion(false)} />;
  }

  // Pantalla principal - solo mostrar acceso al calendario
  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${IMAGES.FONDO}")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Gestión de Operación</h2>
            <p className="text-white/80 text-lg">Sistema de mantenimiento y notas para la planta de concreto</p>
          </div>

          {/* Botón principal para acceder al calendario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <button
              onClick={() => setShowCalendar(true)}
              className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border border-gray-200 hover:border-green-300 hover:bg-green-50/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-800 font-semibold text-xl block">
                    Sistema de Mantenimiento
                  </span>
                  <span className="text-gray-600 text-sm">
                    Gestiona el mantenimiento y notas de la planta
                  </span>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>
          </motion.div>

          {/* Botón para acceder a Seguimiento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <button
              onClick={() => setShowSeguimiento(true)}
              className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 mt-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-800 font-semibold text-xl block">
                    Seguimiento
                  </span>
                  <span className="text-gray-600 text-sm">
                    Calibraciones y verificaciones de operación
                  </span>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>
          </motion.div>
          {/* Botón para acceder a Parámetros de Operación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              onClick={() => setShowParametrosOperacion(true)}
              className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 mt-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-800 font-semibold text-xl block">
                    Parámetros de Operación
                  </span>
                  <span className="text-gray-600 text-sm">
                    Gestión de volumen de producción diaria
                  </span>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </button>
          </motion.div>
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={() => setShowPersonalResults(true)}
                className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 mt-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-800 font-semibold text-xl block">
                      Visualizar Resultados
                    </span>
                    <span className="text-gray-600 text-sm">
                      Resultados de evaluaciones de personal por categorías
                    </span>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mt-1">
                      Solo Administradores
                    </span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              </button>
            </motion.div>
          )}

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: isAdmin ? 0.3 : 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Funcionalidades disponibles:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Programación de mantenimientos</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Registro de notas operativas</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Vista mensual y anual</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Gestión de prioridades</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      <img
        src={IMAGES.CONCRETON}
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
      />
    </div>
  );
};

export default EvaluationScreenOperacion;
