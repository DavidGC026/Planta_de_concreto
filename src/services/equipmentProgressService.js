/**
 * Servicio para manejar el progreso de evaluaciones de equipo
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

import apiService from './api';

class EquipmentProgressService {
  constructor() {
    this.baseEndpoint = 'evaluaciones/progreso-equipo';
  }

  /**
   * Obtener progreso de evaluación de equipo para un usuario y tipo de planta
   */
  async getProgress(userId, plantType) {
    try {
      const params = new URLSearchParams({
        usuario_id: userId,
        tipo_planta: plantType
      });

      const response = await apiService.request(`${this.baseEndpoint}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting equipment progress:', error);
      throw error;
    }
  }

  /**
   * Guardar progreso de una subsección
   */
  async saveSubsectionProgress(progressData) {
    try {
      const data = {
        ...progressData,
        tipo_progreso: 'subseccion'
      };

      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      return response.data;
    } catch (error) {
      console.error('Error saving subsection progress:', error);
      throw error;
    }
  }

  /**
   * Guardar progreso de una sección completa
   */
  async saveSectionProgress(progressData) {
    try {
      const data = {
        ...progressData,
        tipo_progreso: 'seccion'
      };

      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      return response.data;
    } catch (error) {
      console.error('Error saving section progress:', error);
      throw error;
    }
  }

  /**
   * Limpiar progreso de un usuario (útil para testing)
   */
  async clearProgress(userId, plantType) {
    try {
      const params = new URLSearchParams({
        usuario_id: userId,
        tipo_planta: plantType
      });

      const response = await apiService.request(`${this.baseEndpoint}?${params}`, {
        method: 'DELETE'
      });

      return response.data;
    } catch (error) {
      console.error('Error clearing equipment progress:', error);
      throw error;
    }
  }

  /**
   * Verificar si una sección está completada
   */
  isSectionCompleted(progressData, sectionId) {
    if (!progressData || !progressData.secciones) {
      return false;
    }

    const section = progressData.secciones.find(s => s.seccion_id === sectionId);
    return section ? section.completada : false;
  }

  /**
   * Verificar si una subsección está completada
   */
  isSubsectionCompleted(progressData, sectionId, subsectionId) {
    if (!progressData || !progressData.secciones) {
      return false;
    }

    const section = progressData.secciones.find(s => s.seccion_id === sectionId);
    if (!section || !section.subsecciones) {
      return false;
    }

    const subsection = section.subsecciones.find(sub => sub.subseccion_id === subsectionId);
    return subsection ? subsection.completada : false;
  }

  /**
   * Obtener estadísticas de progreso
   */
  getProgressStats(progressData) {
    if (!progressData || !progressData.secciones) {
      return {
        totalSections: 0,
        completedSections: 0,
        progressPercentage: 0,
        totalSubsections: 0,
        completedSubsections: 0
      };
    }

    const totalSections = progressData.secciones.length;
    const completedSections = progressData.secciones.filter(s => s.completada).length;
    const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

    const totalSubsections = progressData.secciones.reduce((total, section) => {
      return total + (section.total_subsecciones || 0);
    }, 0);

    const completedSubsections = progressData.secciones.reduce((total, section) => {
      return total + (section.subsecciones_completadas || 0);
    }, 0);

    return {
      totalSections,
      completedSections,
      progressPercentage: Math.round(progressPercentage),
      totalSubsections,
      completedSubsections
    };
  }

  /**
   * Formatear datos de progreso para el componente de evaluación
   */
  formatProgressForComponent(progressData) {
    if (!progressData || !progressData.secciones) {
      return {};
    }

    const formattedProgress = {};

    progressData.secciones.forEach(section => {
      // Marcar la sección como completada
      if (section.completada) {
        formattedProgress[section.seccion_id] = {
          completed: true,
          score: section.puntaje_porcentaje,
          correctAnswers: section.respuestas_correctas,
          totalQuestions: section.total_preguntas,
          completedDate: section.fecha_completada
        };
      }

      // Marcar las subsecciones como completadas
      if (section.subsecciones) {
        section.subsecciones.forEach(subsection => {
          if (subsection.completada) {
            const key = `${section.seccion_id}-${subsection.subseccion_id}`;
            formattedProgress[key] = {
              completed: true,
              score: subsection.puntaje_porcentaje,
              subsectionId: subsection.subseccion_id,
              sectionId: section.seccion_id
            };
          }
        });
      }
    });

    return formattedProgress;
  }
}

// Crear instancia singleton
const equipmentProgressService = new EquipmentProgressService();

export default equipmentProgressService;

// Exportar también métodos específicos para facilitar el uso
export const {
  getProgress,
  saveSubsectionProgress,
  saveSectionProgress,
  clearProgress,
  isSectionCompleted,
  isSubsectionCompleted,
  getProgressStats,
  formatProgressForComponent
} = equipmentProgressService;
