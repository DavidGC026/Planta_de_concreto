import React, { useState } from 'react';
import { IMAGES } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import UsuariosList from './VisualizacionAvanzada/UsuariosList';
import ResultadosUsuario from './VisualizacionAvanzada/ResultadosUsuario';
import ImageWithFallback from './VisualizacionAvanzada/ImageWithFallback';

const VisualizacionAvanzadaResultados = ({ onBack, username }) => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar permisos de admin al montar
  React.useEffect(() => {
    const user = apiService.getCurrentUser();
    if (!user || user.rol !== 'admin') {
      toast({
        title: "❌ Acceso Denegado",
        description: "Esta funcionalidad está disponible solo para administradores.",
        variant: "destructive"
      });
      onBack();
    }
  }, [onBack]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-100 via-white to-gray-100">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url("${IMAGES.FONDO}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-gray-100/30 z-0" />

      {/* Header con botón de volver */}
      <div className="relative z-10 p-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Gestión</span>
        </Button>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        {!usuarioSeleccionado ? (
          <UsuariosList onSelectUser={setUsuarioSeleccionado} />
        ) : (
          <ResultadosUsuario 
            usuario={usuarioSeleccionado} 
            onBack={() => setUsuarioSeleccionado(null)} 
          />
        )}
      </div>

      {/* Mascota Concreton */}
      <ImageWithFallback
        src={IMAGES.CONCRETON || "/images/Concreton.png"}
        alt="Mascota IMCYC trabajador de construcción"
        className="fixed bottom-0 right-0 md:right-8 z-20"
        style={{ width: 100, height: 180 }}
      />
    </div>
  );
};

export default VisualizacionAvanzadaResultados;
