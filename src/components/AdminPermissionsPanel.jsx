import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Shield, Users, Check, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import permissionsService from '@/services/permissionsService';
import apiService from '@/services/api';

const AdminPermissionsPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [usersData, rolesData, permissionsData] = await Promise.all([
        apiService.request('admin/users').catch(() => ({ data: [] })),
        apiService.getRolesPersonal(),
        permissionsService.getAllPermissions()
      ]);
      
      setUsers(Array.isArray(usersData?.data) ? usersData.data : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los datos de administración"
      });
      // Establecer valores por defecto en caso de error
      setUsers([]);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermission = async (userId, roleCode) => {
    try {
      await permissionsService.assignPermissions(userId, roleCode, true, true);
      
      toast({
        title: "✅ Permiso asignado",
        description: "El permiso se ha asignado exitosamente"
      });
      
      await loadData(); // Recargar datos
      
    } catch (error) {
      console.error('Error assigning permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo asignar el permiso"
      });
    }
  };

  const handleRemovePermission = async (userId, roleCode) => {
    try {
      await permissionsService.removePermissions(userId, roleCode);
      
      toast({
        title: "✅ Permiso eliminado",
        description: "El permiso se ha eliminado exitosamente"
      });
      
      await loadData(); // Recargar datos
      
    } catch (error) {
      console.error('Error removing permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el permiso"
      });
    }
  };

  const getUserPermissions = (userId) => {
    if (!Array.isArray(permissions)) {
      return [];
    }
    return permissions.filter(p => p.usuario_id === userId && p.puede_evaluar);
  };

  const hasPermission = (userId, roleCode) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(p => 
      p.usuario_id === userId && 
      p.rol_codigo === roleCode && 
      p.puede_evaluar
    );
  };

  const getPermissionStats = () => {
    if (!Array.isArray(users)) {
      return {
        totalUsers: 0,
        usersWithRestrictions: 0,
        usersWithFullAccess: 0,
        usersWithoutAccess: 0
      };
    }
    
    const totalUsers = users.length;
    const usersWithRestrictions = users.filter(user => 
      !user.permisos_completos && getUserPermissions(user.id).length > 0
    ).length;
    const usersWithFullAccess = users.filter(user => user.permisos_completos).length;
    
    return {
      totalUsers,
      usersWithRestrictions,
      usersWithFullAccess,
      usersWithoutAccess: totalUsers - usersWithRestrictions - usersWithFullAccess
    };
  };

  const stats = getPermissionStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                Panel de Permisos de Usuario
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los permisos de acceso a roles de evaluación para cada usuario
              </p>
            </div>
            <Button onClick={onBack} variant="outline">
              Volver al Menú
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Acceso Completo</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.usersWithFullAccess}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Acceso Restringido</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.usersWithRestrictions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <X className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sin Acceso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.usersWithoutAccess}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de permisos */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permisos por Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Usuario</th>
                    <th className="text-center p-4 font-semibold">Tipo</th>
                    {roles.map(role => (
                      <th key={role.codigo} className="text-center p-2 font-semibold text-sm">
                        {role.nombre}
                      </th>
                    ))}
                    <th className="text-center p-4 font-semibold">Total Permisos</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const userPermissions = getUserPermissions(user.id);
                    
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.nombre_completo}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        
                        <td className="p-4 text-center">
                          {user.permisos_completos ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Users className="w-3 h-3 mr-1" />
                              Restringido
                            </span>
                          )}
                        </td>
                        
                        {roles.map(role => (
                          <td key={role.codigo} className="p-2 text-center">
                            {user.permisos_completos ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                {hasPermission(user.id, role.codigo) ? (
                                  <button
                                    onClick={() => handleRemovePermission(user.id, role.codigo)}
                                    className="p-1 text-green-600 hover:text-red-600 transition-colors"
                                    title="Quitar permiso"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignPermission(user.id, role.codigo)}
                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                    title="Asignar permiso"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                        
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.permisos_completos ? roles.length : userPermissions.length}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Información sobre Permisos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Tipos de Usuario:</h4>
              <ul className="space-y-1">
                <li>• <strong>Admin:</strong> Acceso completo a todos los roles</li>
                <li>• <strong>Restringido:</strong> Solo roles específicos asignados</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Acciones:</h4>
              <ul className="space-y-1">
                <li>• <strong>✓ Verde:</strong> Permiso activo (click para quitar)</li>
                <li>• <strong>+ Gris:</strong> Sin permiso (click para asignar)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsPanel;