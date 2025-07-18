/**
 * Servicio para manejar permisos de usuarios expandido
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

import apiService from './api';

class PermissionsService {
  constructor() {
    this.baseEndpoint = 'auth/check-permissions.php';
    this.rolesEndpoint = 'evaluaciones/roles-permitidos.php';
    this.adminEndpoint = 'admin/manage-permissions.php';
  }

  /**
   * Verificar si un usuario puede evaluar un tipo específico
   */
  async canUserEvaluate(userId, tipoEvaluacion, roleCode = null) {
    try {
      const requestData = {
        usuario_id: userId,
        tipo_evaluacion: tipoEvaluacion
      };
      
      if (roleCode) {
        requestData.rol_codigo = roleCode;
      }
      
      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      return response.data.puede_evaluar;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  /**
   * Verificar si un usuario puede evaluar un rol específico (legacy)
   */
  async canUserEvaluateRole(userId, roleCode) {
    return this.canUserEvaluate(userId, 'personal', roleCode);
  }

  /**
   * Obtener todos los roles permitidos para un usuario
   */
  async getUserAllowedRoles(userId) {
    try {
      // Log para debugging
      console.log('Obteniendo roles permitidos para usuario:', userId);
      
      const response = await apiService.request(`${this.rolesEndpoint}?usuario_id=${userId}`);
      
      console.log('Respuesta de roles permitidos:', response);
      
      if (!response.success) {
        console.error('Error en respuesta de roles:', response.error);
        return [];
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error getting user allowed roles:', error);
      console.error('Error details:', error.message);
      return [];
    }
  }

  /**
   * Verificar permisos generales de un usuario
   */
  async getUserPermissions(userId) {
    try {
      console.log('Verificando permisos generales para usuario:', userId);
      
      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId
        })
      });

      console.log('Respuesta de permisos generales:', response);
      
      return response.data || { permisos_resumen: {}, total_permisos: 0 };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return { permisos_resumen: {}, total_permisos: 0 };
    }
  }

  /**
   * Asignar permisos a un usuario (solo para administradores)
   */
  async assignPermissions(userId, tipoEvaluacion, canEvaluate, canViewResults = true, roleCode = null) {
    try {
      console.log('Asignando permisos:', { userId, tipoEvaluacion, canEvaluate, roleCode });
      
      const requestData = {
        usuario_id: userId,
        tipo_evaluacion: tipoEvaluacion,
        puede_evaluar: canEvaluate,
        puede_ver_resultados: canViewResults
      };
      
      if (roleCode) {
        requestData.rol_codigo = roleCode;
      }
      
      const response = await apiService.request(this.adminEndpoint, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      console.log('Respuesta de asignación de permisos:', response);
      return response.data;
    } catch (error) {
      console.error('Error assigning permissions:', error);
      throw error;
    }
  }

  /**
   * Eliminar permisos de un usuario (solo para administradores)
   */
  async removePermissions(userId, tipoEvaluacion, roleCode = null) {
    try {
      console.log('Eliminando permisos:', { userId, tipoEvaluacion, roleCode });
      
      let endpoint = `${this.adminEndpoint}?usuario_id=${userId}&tipo_evaluacion=${tipoEvaluacion}`;
      
      if (roleCode) {
        endpoint += `&rol_codigo=${roleCode}`;
      }
      
      const response = await apiService.request(endpoint, { method: 'DELETE' });
      console.log('Respuesta de eliminación de permisos:', response);
      return response.data;
    } catch (error) {
      console.error('Error removing permissions:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los permisos del sistema (solo para administradores)
   */
  async getAllPermissions(userId = null) {
    try {
      const endpoint = userId 
        ? `${this.adminEndpoint}?usuario_id=${userId}`
        : this.adminEndpoint;
      
      const response = await apiService.request(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Filtrar roles según permisos del usuario
   */
  filterRolesByPermissions(allRoles, allowedRoles) {
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return [];
    }

    if (!Array.isArray(allRoles)) {
      return [];
    }
    const allowedCodes = allowedRoles.map(role => role.codigo);
    return allRoles.filter(role => allowedCodes.includes(role.codigo));
  }

  /**
   * Verificar si el usuario tiene permisos completos (es admin)
   */
  async hasFullPermissions(userId) {
    try {
      const permissions = await this.getUserPermissions(userId);
      
      // Si tiene permisos completos, es admin
      const user = apiService.getCurrentUser();
      return user && (user.rol === 'admin' || permissions.permisos_completos);
    } catch (error) {
      console.error('Error checking full permissions:', error);
      return false;
    }
  }

  /**
   * Obtener información de permisos para mostrar en UI
   */
  async getPermissionsInfo(userId) {
    try {
      console.log('Obteniendo información completa de permisos para usuario:', userId);
      
      const [allowedRoles, permissions, hasFullPerms] = await Promise.all([
        this.getUserAllowedRoles(userId),
        this.getUserPermissions(userId),
        this.hasFullPermissions(userId)
      ]);

      console.log('Datos obtenidos:', {
        allowedRoles: allowedRoles.length,
        permissions,
        hasFullPerms
      });
      
      const permisos_resumen = permissions.permisos_resumen || {};

      return {
        allowedRoles,
        hasFullPermissions: hasFullPerms,
        totalAllowedRoles: allowedRoles.length,
        canEvaluatePersonal: allowedRoles.length > 0 || hasFullPerms,
        canEvaluateEquipo: permisos_resumen.equipo || hasFullPerms,
        canEvaluateOperacion: permisos_resumen.operacion || hasFullPerms,
        restrictedAccess: !hasFullPerms,
        permisos_resumen: permisos_resumen,
        total_permisos: permissions.total_permisos || 0
      };
    } catch (error) {
      console.error('Error getting permissions info:', error);
      return {
        allowedRoles: [],
        hasFullPermissions: false,
        totalAllowedRoles: 0,
        canEvaluatePersonal: false,
        canEvaluateEquipo: false,
        canEvaluateOperacion: false,
        restrictedAccess: true,
        permisos_resumen: {},
        total_permisos: 0
      };
    }
  }

  /**
   * Verificar acceso a un tipo de evaluación específico
   */
  async checkEvaluationAccess(userId, tipoEvaluacion) {
    try {
      console.log('Verificando acceso a evaluación:', { userId, tipoEvaluacion });
      
      const permissionsInfo = await this.getPermissionsInfo(userId);
      
      console.log('Información de permisos obtenida:', permissionsInfo);
      
      if (permissionsInfo.hasFullPermissions) {
        console.log('Usuario tiene permisos completos');
        return true;
      }
      
      switch (tipoEvaluacion) {
        case 'personal':
          const canEvaluatePersonal = permissionsInfo.canEvaluatePersonal;
          console.log('Puede evaluar personal:', canEvaluatePersonal);
          return canEvaluatePersonal;
        case 'equipo':
          const canEvaluateEquipo = permissionsInfo.canEvaluateEquipo;
          console.log('Puede evaluar equipo:', canEvaluateEquipo);
          return canEvaluateEquipo;
        case 'operacion':
          const canEvaluateOperacion = permissionsInfo.canEvaluateOperacion;
          console.log('Puede evaluar operación:', canEvaluateOperacion);
          return canEvaluateOperacion;
        default:
          console.log('Tipo de evaluación no válido:', tipoEvaluacion);
          return false;
      }
    } catch (error) {
      console.error('Error checking evaluation access:', error);
      return false;
    }
  }
}

// Crear instancia singleton
const permissionsService = new PermissionsService();

export default permissionsService;

// Exportar también métodos específicos para facilitar el uso
export const {
  canUserEvaluate,
  canUserEvaluateRole,
  getUserAllowedRoles,
  getUserPermissions,
  assignPermissions,
  removePermissions,
  getAllPermissions,
  filterRolesByPermissions,
  hasFullPermissions,
  getPermissionsInfo,
  checkEvaluationAccess
} = permissionsService;