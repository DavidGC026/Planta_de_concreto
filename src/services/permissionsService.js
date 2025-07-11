/**
 * Servicio para manejar permisos de usuarios
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
   * Verificar si un usuario puede evaluar un rol específico
   */
  async canUserEvaluateRole(userId, roleCode) {
    try {
      const response = await apiService.request(this.baseEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId,
          rol_codigo: roleCode
        })
      });

      return response.data.puede_evaluar;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  /**
   * Obtener todos los roles permitidos para un usuario
   */
  async getUserAllowedRoles(userId) {
    try {
      const response = await apiService.request(`${this.rolesEndpoint}?usuario_id=${userId}`);
      return response.data;
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

      return response.data;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return { roles_permitidos: [], total_roles: 0 };
    }
  }

  /**
   * Asignar permisos a un usuario (solo para administradores)
   */
  async assignPermissions(userId, roleCode, canEvaluate, canViewResults = true) {
    try {
      const response = await apiService.request(this.adminEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId,
          rol_codigo: roleCode,
          puede_evaluar: canEvaluate,
          puede_ver_resultados: canViewResults
        })
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
  async removePermissions(userId, roleCode) {
    try {
      const response = await apiService.request(
        `${this.adminEndpoint}?usuario_id=${userId}&rol_codigo=${roleCode}`,
        { method: 'DELETE' }
      );

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
      return response.data;
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Filtrar roles según permisos del usuario
   */
  filterRolesByPermissions(allRoles, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
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
      
      // Si tiene muchos roles permitidos, probablemente es admin
      // También podríamos verificar el rol del usuario directamente
      const user = apiService.getCurrentUser();
      return user && (user.rol === 'admin' || permissions.total_roles >= 4);
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
      const [allowedRoles, hasFullPerms] = await Promise.all([
        this.getUserAllowedRoles(userId),
        this.hasFullPermissions(userId)
      ]);

      return {
        allowedRoles,
        hasFullPermissions: hasFullPerms,
        totalAllowedRoles: allowedRoles.length,
        canEvaluatePersonal: allowedRoles.some(role => role.codigo === 'jefe_planta'),
        restrictedAccess: !hasFullPerms && allowedRoles.length < 4
      };
    } catch (error) {
      console.error('Error getting permissions info:', error);
      return {
        allowedRoles: [],
        hasFullPermissions: false,
        totalAllowedRoles: 0,
        canEvaluatePersonal: false,
        restrictedAccess: true
      };
    }
  }
}

// Crear instancia singleton
const permissionsService = new PermissionsService();

export default permissionsService;

// Exportar también métodos específicos para facilitar el uso
export const {
  canUserEvaluateRole,
  getUserAllowedRoles,
  getUserPermissions,
  assignPermissions,
  removePermissions,
  getAllPermissions,
  filterRolesByPermissions,
  hasFullPermissions,
  getPermissionsInfo
} = permissionsService;