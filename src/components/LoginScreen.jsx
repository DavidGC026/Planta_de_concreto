import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { IMAGES } from '@/utils/paths';

const LoginScreen = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const user = await apiService.login(credentials.username, credentials.password);

      toast({
        title: "✅ Inicio de sesión exitoso",
        description: `Bienvenido ${user.nombre_completo}`
      });

      onLogin(user.username);
    } catch (error) {
      console.error('Login error:', error);
      setError('Usuario o contraseña incorrectos');

      toast({
        title: "❌ Error de autenticación",
        description: "Verifica tus credenciales e intenta nuevamente"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen custom-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass-card border-0 rounded-xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6 bg-white/50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
              className="mx-auto mb-6"
            >
              <img
                alt="Logo IMCYC"
                className="h-16 w-auto"
                src="public/Logo_imcyc.png"
              />
            </motion.div>

            <h1 className="text-4xl font-extrabold login-title">PLANTAS</h1>
            <p className="text-3xl font-extrabold login-title -mt-2">DE CONCRETO</p>
            <p className="text-md login-subtitle mt-1">Sistema de Evaluación IMCYC</p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nombre de usuario"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-base"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-base"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 imcyc-button text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? 'INGRESANDO...' : 'INGRESAR'}
                </Button>
              </motion.div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Usuario de prueba: <strong>admin</strong> | Contraseña: <strong>admin123</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-8"
        >
          <p className="text-white text-sm font-medium">
            © {new Date().getFullYear()} IMCYC - Instituto Mexicano del Cemento y del Concreto A.C.
          </p>
        </motion.div>
      </motion.div>
       <motion.div
        initial={{ opacity: 0, x: 100, y:50 }}
        animate={{ opacity: 1, x: 0, y:0 }}
        transition={{ duration: 1.2, delay: 0.6, type: "spring", stiffness: 50 }}
        className="fixed bottom-0 right-0 z-0"
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

export default LoginScreen;
