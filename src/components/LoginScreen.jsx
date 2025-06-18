import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.username && credentials.password) {
      onLogin(credentials.username);
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
                src="/Logo_imcyc.png" 
              />
            </motion.div>
            
            <h1 className="text-4xl font-extrabold login-title">PLANTAS</h1>
            <p className="text-3xl font-extrabold login-title -mt-2">DE CONCRETO</p>
            <p className="text-md login-subtitle mt-1">Sistema de Evaluación IMCYC</p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
                  />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="pt-2"
              >
                <Button 
                  type="submit" 
                  className="w-full h-14 imcyc-button text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  INGRESAR
                </Button>
              </motion.div>
            </form>
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
          className="w-auto h-64 md:h-80 drop-shadow-2xl"
          src="/Concreton.png" 
        />
      </motion.div>
    </div>
  );
};

export default LoginScreen;