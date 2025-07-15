/**
 * Servicio para manejar permisos de usuarios expandido
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

import apiService from './api';

class PermissionsService {
  constructor() {
    this.baseEndpoint = 'auth/check-permissions';
    this.rolesEndpoint = 'evaluaciones/roles-permitidos';
    this.adminEndpoint = 'admin/manage-permissions';
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
      const response = await apiService.request(`${this.rolesEndpoint}?usuario_id=${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting user allowed roles:', error);
      return [];
    }
  }

  /**
   * Verificar permisos generales de un usuario
   */
  async getUserPermissions(userId) {
    try {
      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId
        })
      });

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
      let endpoint = `${this.adminEndpoint}?usuario_id=${userId}&tipo_evaluacion=${tipoEvaluacion}`;
      
      if (roleCode) {
        endpoint += `&rol_codigo=${roleCode}`;
      }
      
      const response = await apiService.request(endpoint, { method: 'DELETE' });
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
      const [allowedRoles, permissions, hasFullPerms] = await Promise.all([
        this.getUserAllowedRoles(userId),
        this.getUserPermissions(userId),
        this.hasFullPermissions(userId)
      ]);

      const permisos_resumen = permissions.permisos_resumen || {};

      return {
        allowedRoles,
        hasFullPermissions: hasFullPerms,
        totalAllowedRoles: allowedRoles.length,
        canEvaluatePersonal: allowedRoles.some(role => role.codigo === 'jefe_planta') || hasFullPerms,
        canEvaluateEquipo: permisos_resumen.equipo || hasFullPerms,
        canEvaluateOperacion: permisos_resumen.operacion || hasFullPerms,
        restrictedAccess: !hasFullPerms && permissions.total_permisos < 3,
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
      const permissionsInfo = await this.getPermissionsInfo(userId);
      
      if (permissionsInfo.hasFullPermissions) {
        return true;
      }
      
      switch (tipoEvaluacion) {
        case 'personal':
          return permissionsInfo.canEvaluatePersonal;
        case 'equipo':
          return permissionsInfo.canEvaluateEquipo;
        case 'operacion':
          return permissionsInfo.canEvaluateOperacion;
        default:
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