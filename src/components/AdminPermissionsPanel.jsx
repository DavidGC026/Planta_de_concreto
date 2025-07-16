import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Shield, Users, Check, X, Plus, Trash2, AlertTriangle, Settings, ClipboardCheck, UserCheck } from 'lucide-react';
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
        apiService.request('admin/users.php').catch(() => ({ data: [] })),
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
      setUsers([]);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPersonalPermission = async (userId, roleCode) => {
    try {
      await permissionsService.assignPermissions(userId, 'personal', true, true, roleCode);
      
      toast({
        title: "✅ Permiso de personal asignado",
        description: "El permiso se ha asignado exitosamente"
      });
      
      await loadData();
      
    } catch (error) {
      console.error('Error assigning personal permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo asignar el permiso de personal"
      });
    }
  };

  const handleRemovePersonalPermission = async (userId, roleCode) => {
    try {
      await permissionsService.removePermissions(userId, 'personal', roleCode);
      
      toast({
        title: "✅ Permiso de personal eliminado",
        description: "El permiso se ha eliminado exitosamente"
      });
      
      await loadData();
      
    } catch (error) {
      console.error('Error removing personal permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el permiso de personal"
      });
    }
  };

  const handleToggleEquipmentPermission = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await permissionsService.removePermissions(userId, 'equipo');
        toast({
          title: "✅ Permiso de equipo eliminado",
          description: "El permiso se ha eliminado exitosamente"
        });
      } else {
        await permissionsService.assignPermissions(userId, 'equipo', true, true);
        toast({
          title: "✅ Permiso de equipo asignado",
          description: "El permiso se ha asignado exitosamente"
        });
      }
      
      await loadData();
      
    } catch (error) {
      console.error('Error toggling equipment permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo modificar el permiso de equipo"
      });
    }
  };

  const handleToggleOperationPermission = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await permissionsService.removePermissions(userId, 'operacion');
        toast({
          title: "✅ Permiso de operación eliminado",
          description: "El permiso se ha eliminado exitosamente"
        });
      } else {
        await permissionsService.assignPermissions(userId, 'operacion', true, true);
        toast({
          title: "✅ Permiso de operación asignado",
          description: "El permiso se ha asignado exitosamente"
        });
      }
      
      await loadData();
      
    } catch (error) {
      console.error('Error toggling operation permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo modificar el permiso de operación"
      });
    }
  };

  const getUserPersonalPermissions = (userId) => {
    if (!Array.isArray(permissions)) {
      return [];
    }
    return permissions.filter(p => 
      p.usuario_id === userId && 
      p.puede_evaluar_personal && 
      p.rol_codigo
    );
  };

  const hasPersonalPermission = (userId, roleCode) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(p => 
      p.usuario_id === userId && 
      p.rol_codigo === roleCode && 
      p.puede_evaluar_personal
    );
  };

  const hasEquipmentPermission = (userId) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(p => 
      p.usuario_id === userId && 
      p.puede_evaluar_equipo
    );
  };

  const hasOperationPermission = (userId) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(p => 
      p.usuario_id === userId && 
      p.puede_evaluar_operacion
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
    const usersWithFullAccess = users.filter(user => user.permisos_completos).length;
    
    const usersWithRestrictions = users.filter(user => {
      if (user.permisos_completos) return false;
      
      const personalPerms = getUserPersonalPermissions(user.id).length;
      const equipmentPerm = hasEquipmentPermission(user.id);
      const operationPerm = hasOperationPermission(user.id);
      
      return personalPerms > 0 || equipmentPerm || operationPerm;
    }).length;
    
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
                Gestiona los permisos de acceso a evaluaciones para cada usuario
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

        {/* Tabla de permisos expandida */}
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
                    
                    {/* Columnas de Personal */}
                    <th className="text-center p-2 font-semibold text-sm bg-blue-50" colSpan={roles.length}>
                      <div className="flex items-center justify-center">
                        <UserCheck className="w-4 h-4 mr-1 text-blue-600" />
                        Personal
                      </div>
                    </th>
                    
                    {/* Columnas de Equipo y Operación */}
                    <th className="text-center p-4 font-semibold bg-green-50">
                      <div className="flex items-center justify-center">
                        <Settings className="w-4 h-4 mr-1 text-green-600" />
                        Equipo
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold bg-purple-50">
                      <div className="flex items-center justify-center">
                        <ClipboardCheck className="w-4 h-4 mr-1 text-purple-600" />
                        Operación
                      </div>
                    </th>
                    
                    <th className="text-center p-4 font-semibold">Total</th>
                  </tr>
                  
                  {/* Sub-header para roles de personal */}
                  <tr className="border-b bg-gray-50">
                    <th></th>
                    <th></th>
                    {roles.map(role => (
                      <th key={role.codigo} className="text-center p-2 font-medium text-xs">
                        {role.nombre.length > 15 ? role.nombre.substring(0, 15) + '...' : role.nombre}
                      </th>
                    ))}
                    <th></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const personalPermissions = getUserPersonalPermissions(user.id);
                    const hasEquipment = hasEquipmentPermission(user.id);
                    const hasOperation = hasOperationPermission(user.id);
                    const totalPermissions = personalPermissions.length + 
                                           (hasEquipment ? 1 : 0) + 
                                           (hasOperation ? 1 : 0);
                    
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
                        
                        {/* Permisos de Personal */}
                        {roles.map(role => (
                          <td key={role.codigo} className="p-2 text-center">
                            {user.permisos_completos ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                {hasPersonalPermission(user.id, role.codigo) ? (
                                  <button
                                    onClick={() => handleRemovePersonalPermission(user.id, role.codigo)}
                                    className="p-1 text-green-600 hover:text-red-600 transition-colors"
                                    title="Quitar permiso"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignPersonalPermission(user.id, role.codigo)}
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
                        
                        {/* Permisos de Equipo */}
                        <td className="p-4 text-center">
                          {user.permisos_completos ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <button
                              onClick={() => handleToggleEquipmentPermission(user.id, hasEquipment)}
                              className={`p-2 rounded-lg transition-colors ${
                                hasEquipment 
                                  ? 'text-green-600 bg-green-100 hover:bg-red-100 hover:text-red-600' 
                                  : 'text-gray-400 bg-gray-100 hover:bg-green-100 hover:text-green-600'
                              }`}
                              title={hasEquipment ? "Quitar permiso de equipo" : "Asignar permiso de equipo"}
                            >
                              {hasEquipment ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        
                        {/* Permisos de Operación */}
                        <td className="p-4 text-center">
                          {user.permisos_completos ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <button
                              onClick={() => handleToggleOperationPermission(user.id, hasOperation)}
                              className={`p-2 rounded-lg transition-colors ${
                                hasOperation 
                                  ? 'text-green-600 bg-green-100 hover:bg-red-100 hover:text-red-600' 
                                  : 'text-gray-400 bg-gray-100 hover:bg-green-100 hover:text-green-600'
                              }`}
                              title={hasOperation ? "Quitar permiso de operación" : "Asignar permiso de operación"}
                            >
                              {hasOperation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.permisos_completos ? roles.length + 2 : totalPermissions}
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
                <li>• <strong>Admin:</strong> Acceso completo a todas las evaluaciones</li>
                <li>• <strong>Restringido:</strong> Solo evaluaciones específicas asignadas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tipos de Evaluación:</h4>
              <ul className="space-y-1">
                <li>• <strong>Personal:</strong> Evaluación por roles específicos</li>
                <li>• <strong>Equipo:</strong> Evaluación de equipos de la planta</li>
                <li>• <strong>Operación:</strong> Evaluación de procesos operativos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsPanel;