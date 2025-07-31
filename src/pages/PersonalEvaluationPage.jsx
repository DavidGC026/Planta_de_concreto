import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PersonalEvaluationStandalone from '../components/EvaluationPersonalPage';

/**
 * Página de integración para la evaluación de personal
 * Puede recibir datos del usuario por:
 * 1. Query parameters en la URL
 * 2. PostMessage desde una página padre (iframe)
 * 3. Props directas
 */
const PersonalEvaluationPage = ({ embedUser: propsEmbedUser }) => {
  const [embedUser, setEmbedUser] = useState(propsEmbedUser);
  const [searchParams] = useSearchParams();

  // Método 1: Obtener datos del usuario desde query parameters
  useEffect(() => {
    if (!embedUser) {
      const userFromParams = {
        id: searchParams.get('userId'),
        nombre: searchParams.get('nombre'),
        username: searchParams.get('username'),
        email: searchParams.get('email')
      };

      // Verificar si hay datos válidos en los parámetros
      if (userFromParams.id) {
        setEmbedUser(userFromParams);
      }
    }
  }, [searchParams, embedUser]);

  // Método 2: Escuchar mensajes de postMessage (para iframe)
  useEffect(() => {
    const handleMessage = (event) => {
      // Verificar origen si es necesario
      // if (event.origin !== 'https://tu-dominio.com') return;

      if (event.data.type === 'USER_DATA' && event.data.user) {
        setEmbedUser(event.data.user);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Método 3: Datos de demostración si no hay usuario
  useEffect(() => {
    if (!embedUser) {
      // Usar datos de demostración después de 2 segundos
      const timer = setTimeout(() => {
        setEmbedUser({
          id: 999,
          nombre: "Usuario Demo",
          username: "demo",
          email: "demo@ejemplo.com"
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [embedUser]);

  // Pantalla de carga mientras se obtienen los datos del usuario
  if (!embedUser || !embedUser.id) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Cargando evaluación...</h2>
          <p className="text-gray-600">Obteniendo datos del usuario</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Esperando datos del usuario por:</p>
            <ul className="mt-2 space-y-1">
              <li>• Query parameters en la URL</li>
              <li>• PostMessage desde página padre</li>
              <li>• Props del componente</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <PersonalEvaluationStandalone embedUser={embedUser} />;
};

export default PersonalEvaluationPage;

// Ejemplo de cómo usar en React Router
/*
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PersonalEvaluationPage from './pages/PersonalEvaluationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/evaluacion-personal" element={<PersonalEvaluationPage />} />
        {/* otras rutas */}
      </Routes>
    </Router>
  );
}
*/

// Ejemplo de URLs válidas:
/*
// Con query parameters
/evaluacion-personal?userId=123&nombre=Juan%20Pérez&username=jperez&email=juan@empresa.com

// Con props directas
<PersonalEvaluationPage embedUser={{ id: 123, nombre: "Juan Pérez" }} />

// Para iframe con postMessage
<iframe src="/evaluacion-personal" width="100%" height="800"></iframe>
<script>
  iframe.onload = function() {
    iframe.contentWindow.postMessage({
      type: 'USER_DATA',
      user: { id: 123, nombre: "Juan Pérez", username: "jperez" }
    }, '*');
  };
</script>
*/
