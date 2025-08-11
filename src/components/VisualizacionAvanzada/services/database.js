class DatabaseService {
  constructor() {
    // Configurar la URL base de la API
    // En desarrollo usa puerto 8000, en producción usa la ruta relativa
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/ver_resultados/api' 
      : 'http://localhost:8000/api';
    
    // Datos de prueba para desarrollo
    this.testData = [
      {
        id: 1,
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        fecha: '2024-01-15',
        fecha_formateada: '15 de enero de 2024',
        total_obtenido: 85,
        pass: true,
        respuestas: { pregunta1: 'respuesta1', pregunta2: 'respuesta2' },
        calificaciones_secciones: {
          'Seguridad': { porcentaje: 90 },
          'Calidad': { porcentaje: 80 },
          'Procedimientos': { porcentaje: 85 },
          'Normativas': { porcentaje: 88 }
        }
      },
      {
        id: 2,
        nombre: 'María García',
        email: 'maria@example.com',
        fecha: '2024-01-16',
        fecha_formateada: '16 de enero de 2024',
        total_obtenido: 92,
        pass: true,
        respuestas: { pregunta1: 'respuesta1', pregunta2: 'respuesta2' },
        calificaciones_secciones: {
          'Seguridad': { porcentaje: 95 },
          'Calidad': { porcentaje: 90 },
          'Procedimientos': { porcentaje: 88 },
          'Normativas': { porcentaje: 95 }
        }
      },
      {
        id: 3,
        nombre: 'Carlos López',
        email: 'carlos@example.com',
        fecha: '2024-01-17',
        fecha_formateada: '17 de enero de 2024',
        total_obtenido: 65,
        pass: false,
        respuestas: { pregunta1: 'respuesta1', pregunta2: 'respuesta2' },
        calificaciones_secciones: {
          'Seguridad': { porcentaje: 70 },
          'Calidad': { porcentaje: 60 },
          'Procedimientos': { porcentaje: 65 },
          'Normativas': { porcentaje: 65 }
        }
      },
      {
        id: 4,
        nombre: 'Ana Rodríguez',
        email: 'ana@example.com',
        fecha: '2024-01-18',
        fecha_formateada: '18 de enero de 2024',
        total_obtenido: 78,
        pass: true,
        respuestas: { 
          pregunta1: 'Seguir protocolos de seguridad',
          pregunta2: 'Usar equipo de protección personal',
          pregunta3: 'Verificar calidad de materiales'
        },
        calificaciones_secciones: {
          'Seguridad': { porcentaje: 85 },
          'Calidad': { porcentaje: 75 },
          'Procedimientos': { porcentaje: 80 },
          'Normativas': { porcentaje: 72 },
          'Gestión': { porcentaje: 78 }
        }
      },
      {
        id: 5,
        nombre: 'Pedro Martínez',
        email: 'pedro@example.com',
        fecha: '2024-01-19',
        fecha_formateada: '19 de enero de 2024',
        total_obtenido: 94,
        pass: true,
        respuestas: { 
          pregunta1: 'Implementar controles de calidad',
          pregunta2: 'Supervisar personal constantemente',
          pregunta3: 'Documentar todos los procesos'
        },
        calificaciones_secciones: {
          'Seguridad': { porcentaje: 98 },
          'Calidad': { porcentaje: 92 },
          'Procedimientos': { porcentaje: 96 },
          'Normativas': { porcentaje: 90 },
          'Gestión': { porcentaje: 94 },
          'Liderazgo': { porcentaje: 89 }
        }
      }
    ];
  }

  async getResults() {
    try {
      console.log('Intentando conectar a API:', `${this.baseURL}/get-results.php`);
      const response = await fetch(`${this.baseURL}/get-results.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Datos obtenidos de la API:', result.total_records, 'registros');
        return result.data || [];
      } else {
        throw new Error(result.error || 'Error al obtener resultados');
      }
    } catch (error) {
      console.warn('API no disponible, usando datos de prueba:', error.message);
      console.warn('Asegúrate de que el servidor PHP esté ejecutándose en localhost:8000');
      // Usar datos de prueba si la API no está disponible
      return this.testData;
    }
  }

  async getUserByEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/get-user-by-email.php?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Usuario no encontrado');
      }
    } catch (error) {
      console.warn('API no disponible, buscando en datos de prueba:', error.message);
      // Buscar en datos de prueba
      const user = this.testData.find(item => item.email === email);
      if (user) {
        return {
          id: user.id,
          nombre: user.nombre,
          name: user.nombre,
          email: user.email
        };
      } else {
        throw new Error('Usuario no encontrado');
      }
    }
  }

  // Método para obtener resultados por usuario
  async getResultsByUser(userName) {
    try {
      const allResults = await this.getResults();
      return allResults.filter(result => result.nombre === userName);
    } catch (error) {
      console.error('Error fetching results by user:', error);
      throw error;
    }
  }

  // Método para obtener usuarios únicos
  async getUniqueUsers() {
    try {
      const results = await this.getResults();
      const uniqueUsers = Array.from(new Set(results.map(r => r.nombre))).filter(Boolean);
      return uniqueUsers;
    } catch (error) {
      console.error('Error fetching unique users:', error);
      throw error;
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;
