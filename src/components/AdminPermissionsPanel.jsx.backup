import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Shield, Users, Check, X, Plus, Trash2, AlertTriangle, Settings, ClipboardCheck, UserCheck, GraduationCap, ArrowLeft, Edit, Save, UserPlus, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import permissionsService from '@/services/permissionsService';
import apiService from '@/services/api';

const AdminPermissionsPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPlantManagerUsers, setShowPlantManagerUsers] = useState(false);
  const [plantManagerUsers, setPlantManagerUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', empresa: '' });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    email: '',
    rol: 'evaluador'
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

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

  const handleTogglePlantManagerPermission = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await permissionsService.removePermissions(userId, 'jefe_planta');
        toast({
          title: "✅ Permiso de jefe de planta eliminado",
          description: "El permiso se ha eliminado exitosamente"
        });
      } else {
        await permissionsService.assignPermissions(userId, 'jefe_planta', true, true);
        toast({
          title: "✅ Permiso de jefe de planta asignado",
          description: "El permiso se ha asignado exitosamente"
        });
      }
      
      await loadData();
      
    } catch (error) {
      console.error('Error toggling plant manager permission:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo modificar el permiso de jefe de planta"
      });
    }
  };

  const loadPlantManagerUsers = async () => {
    try {
      setLoading(true);
      // Obtener usuarios que han hecho la evaluación de jefe de planta
      const response = await apiService.request('evaluaciones-jefe/usuarios-con-evaluacion.php');
      setPlantManagerUsers(Array.isArray(response?.data) ? response.data : []);
      setShowPlantManagerUsers(true);
      
      toast({
        title: "✅ Datos cargados",
        description: "Se han cargado los usuarios que han realizado evaluaciones de jefe de planta"
      });
      
    } catch (error) {
      console.error('Error loading plant manager users:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los usuarios que han hecho evaluaciones de jefe de planta"
      });
      setPlantManagerUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditForm({
      nombre: user.nombre || '',
      empresa: user.empresa || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nombre: '', empresa: '' });
  };

  const handleSaveUserEdit = async (userId) => {
    try {
      const updateData = {
        usuario_id: userId,
        nombre: editForm.nombre.trim(),
        empresa: editForm.empresa.trim()
      };

      // Validar que al menos un campo tenga datos
      if (!updateData.nombre && !updateData.empresa) {
        toast({
          title: "❌ Error",
          description: "Debe proporcionar al menos el nombre o la empresa"
        });
        return;
      }

      const response = await apiService.request('admin/manage-jefe-planta-users.php', {
        method: 'POST',
        body: JSON.stringify(updateData)
      });

      if (response.success) {
        // Actualizar el estado local con los datos del usuario actualizado
        setPlantManagerUsers(prev => prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                nombre: response.data.usuario_actualizado?.nombre || u.nombre,
                empresa: response.data.usuario_actualizado?.empresa || u.empresa
              }
            : u
        ));

        setEditingUser(null);
        setEditForm({ nombre: '', empresa: '' });

        toast({
          title: "✅ Usuario actualizado",
          description: "Los datos del usuario se han actualizado correctamente"
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron actualizar los datos del usuario"
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

  const hasPlantManagerPermission = (userId) => {
    if (!Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(p => 
      p.usuario_id === userId &&
      p.puede_hacer_examen_jefe_planta
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

  // Función para crear usuario
  const handleCreateUser = async () => {
    try {
      // Validaciones
      if (!createUserForm.username.trim()) {
        toast({
          title: "❌ Error",
          description: "El nombre de usuario es requerido"
        });
        return;
      }

      if (!createUserForm.password) {
        toast({
          title: "❌ Error",
          description: "La contraseña es requerida"
        });
        return;
      }

      if (createUserForm.password !== createUserForm.confirmPassword) {
        toast({
          title: "❌ Error",
          description: "Las contraseñas no coinciden"
        });
        return;
      }

      if (createUserForm.password.length < 6) {
        toast({
          title: "❌ Error",
          description: "La contraseña debe tener al menos 6 caracteres"
        });
        return;
      }

      if (!createUserForm.nombre_completo.trim()) {
        toast({
          title: "❌ Error",
          description: "El nombre completo es requerido"
        });
        return;
      }

      if (!createUserForm.email.trim()) {
        toast({
          title: "❌ Error",
          description: "El email es requerido"
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createUserForm.email)) {
        toast({
          title: "❌ Error",
          description: "El formato del email no es válido"
        });
        return;
      }

      setLoading(true);

      const response = await apiService.request('admin/create-user.php', {
        method: 'POST',
        body: JSON.stringify({
          username: createUserForm.username.trim(),
          password: createUserForm.password,
          nombre_completo: createUserForm.nombre_completo.trim(),
          email: createUserForm.email.trim(),
          rol: createUserForm.rol
        })
      });

      if (response.success) {
        toast({
          title: "✅ Usuario creado",
          description: `El usuario ${createUserForm.username} ha sido creado exitosamente`
        });

        // Resetear formulario
        setCreateUserForm({
          username: '',
          password: '',
          confirmPassword: '',
          nombre_completo: '',
          email: '',
          rol: 'evaluador'
        });

        setShowCreateUserModal(false);
        await loadData(); // Recargar la lista de usuarios
      } else {
        toast({
          title: "❌ Error",
          description: response.message || "No se pudo crear el usuario"
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "❌ Error",
        description: "Error interno del servidor"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    try {
      if (!changePasswordForm.newPassword) {
        toast({
          title: "❌ Error",
          description: "La nueva contraseña es requerida"
        });
        return;
      }

      if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
        toast({
          title: "❌ Error",
          description: "Las contraseñas no coinciden"
        });
        return;
      }

      if (changePasswordForm.newPassword.length < 6) {
        toast({
          title: "❌ Error",
          description: "La contraseña debe tener al menos 6 caracteres"
        });
        return;
      }

      setLoading(true);

      const response = await apiService.request('admin/change-password.php', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserForPassword.id,
          new_password: changePasswordForm.newPassword
        })
      });

      if (response.success) {
        toast({
          title: "✅ Contraseña actualizada",
          description: `La contraseña de ${selectedUserForPassword.nombre_completo} ha sido actualizada`
        });

        // Resetear formulario
        setChangePasswordForm({
          newPassword: '',
          confirmPassword: ''
        });

        setShowChangePasswordModal(false);
        setSelectedUserForPassword(null);
      } else {
        toast({
          title: "❌ Error",
          description: response.message || "No se pudo actualizar la contraseña"
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "❌ Error",
        description: "Error interno del servidor"
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-100 p-6 pt-24">
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

        {/* Botones de administración de usuarios */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button 
            onClick={loadPlantManagerUsers}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Ver Usuarios con Evaluaciones de Jefe de Planta
          </Button>
          
          <Button 
            onClick={() => setShowCreateUserModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Crear Nuevo Usuario
          </Button>
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
                    
                    {/* Columnas de Equipo, Operación y Jefe de Planta */}
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
                    <th className="text-center p-4 font-semibold bg-orange-50">
                      <div className="flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 mr-1 text-orange-600" />
                        Jefe Planta
                      </div>
                    </th>
                    
                    <th className="text-center p-4 font-semibold">Total</th>
                    <th className="text-center p-4 font-semibold">Acciones</th>
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
                        
                        {/* Permisos de Jefe de Planta */}
                        <td className="p-4 text-center">
                          {user.permisos_completos ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <button
                              onClick={() => handleTogglePlantManagerPermission(user.id, hasPlantManagerPermission(user.id))}
                              className={`p-2 rounded-lg transition-colors ${
                                hasPlantManagerPermission(user.id) 
                                  ? 'text-green-600 bg-green-100 hover:bg-red-100 hover:text-red-600' 
                                  : 'text-gray-400 bg-gray-100 hover:bg-green-100 hover:text-green-600'
                              }`}
                              title={hasPlantManagerPermission(user.id) ? "Quitar permiso de jefe de planta" : "Asignar permiso de jefe de planta"}
                            >
                              {hasPlantManagerPermission(user.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.permisos_completos ? roles.length + 3 : totalPermissions}
                          </span>
                        </td>
                        
                        {/* Celda de Acciones */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(user);
                              setShowChangePasswordModal(true);
                            }}
                            className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
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

        {/* Modal para crear usuario */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCreateUserModal(false)}></div>
              
              {/* Center modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center" id="modal-title">
                          <UserPlus className="w-6 h-6 mr-2 text-green-600" />
                          Crear Nuevo Usuario
                        </h3>
                        <button
                          onClick={() => setShowCreateUserModal(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Formulario */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                          <Input
                            type="text"
                            value={createUserForm.username}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Ingrese el nombre de usuario"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                          <Input
                            type="text"
                            value={createUserForm.nombre_completo}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, nombre_completo: e.target.value }))}
                            placeholder="Ingrese el nombre completo"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <Input
                            type="email"
                            value={createUserForm.email}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Ingrese el email"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                          <select
                            value={createUserForm.rol}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, rol: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="evaluador">Evaluador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                          <Input
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Ingrese la contraseña (mín. 6 caracteres)"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                          <Input
                            type="password"
                            value={createUserForm.confirmPassword}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirme la contraseña"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={handleCreateUser}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateUserModal(false)}
                    variant="outline"
                    className="w-full sm:w-auto sm:mr-3 mt-3 sm:mt-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal para cambiar contraseña */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowChangePasswordModal(false)}></div>
              
              {/* Center modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center" id="modal-title">
                          <Key className="w-6 h-6 mr-2 text-blue-600" />
                          Cambiar Contraseña
                        </h3>
                        <button
                          onClick={() => setShowChangePasswordModal(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {selectedUserForPassword && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Usuario:</strong> {selectedUserForPassword.nombre_completo || selectedUserForPassword.username}
                          </p>
                          <p className="text-sm text-blue-600">
                            {selectedUserForPassword.email}
                          </p>
                        </div>
                      )}
                      
                      {/* Formulario */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                          <Input
                            type="password"
                            value={changePasswordForm.newPassword}
                            onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Ingrese la nueva contraseña (mín. 6 caracteres)"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                          <Input
                            type="password"
                            value={changePasswordForm.confirmPassword}
                            onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirme la nueva contraseña"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={handleChangePassword}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </Button>
                  <Button
                    onClick={() => setShowChangePasswordModal(false)}
                    variant="outline"
                    className="w-full sm:w-auto sm:mr-3 mt-3 sm:mt-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para usuarios de jefe de planta */}
        {showPlantManagerUsers && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPlantManagerUsers(false)}></div>
              
              {/* Center modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl leading-6 font-semibold text-gray-900 flex items-center" id="modal-title">
                          <GraduationCap className="w-6 h-6 mr-2 text-orange-600" />
                          Usuarios con Evaluaciones de Jefe de Planta
                        </h3>
                        <button
                          onClick={() => setShowPlantManagerUsers(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Estadísticas rápidas */}
                      {plantManagerUsers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">{plantManagerUsers.length}</div>
                            <div className="text-sm text-blue-800">Total Usuarios</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">
                              {plantManagerUsers.filter(u => u.puede_hacer_examen).length}
                            </div>
                            <div className="text-sm text-green-800">Con Permisos</div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-yellow-600">
                              {plantManagerUsers.filter(u => u.total_evaluaciones > 0).length}
                            </div>
                            <div className="text-sm text-yellow-800">Con Evaluaciones</div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-red-600">
                              {plantManagerUsers.filter(u => u.estado_resumen?.necesita_atencion).length}
                            </div>
                            <div className="text-sm text-red-800">Necesitan Atención</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Tabla de usuarios */}
                      <div className="mt-4 overflow-x-auto">
                        {loading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando usuarios...</p>
                          </div>
                        ) : plantManagerUsers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No se encontraron usuarios con evaluaciones de jefe de planta</p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Empresa
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Evaluaciones
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Mejor Calificación
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Oportunidades
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Permisos
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {plantManagerUsers.map((user, index) => (
                                <motion.tr 
                                  key={user.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      {editingUser === user.id ? (
                                        <Input
                                          value={editForm.nombre}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                                          className="text-sm font-medium mb-1"
                                          placeholder="Nombre del usuario"
                                        />
                                      ) : (
                                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                                      )}
                                      <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editingUser === user.id ? (
                                      <Input
                                        value={editForm.empresa}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, empresa: e.target.value }))}
                                        className="text-sm"
                                        placeholder="Nombre de la empresa"
                                      />
                                    ) : (
                                      user.empresa
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {user.total_evaluaciones}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {user.mejor_calificacion ? (
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.mejor_calificacion >= 80 ? 'bg-green-100 text-green-800' :
                                        user.mejor_calificacion >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {user.mejor_calificacion.toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">N/A</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      user.oportunidades >= 3 ? 'bg-red-100 text-red-800' :
                                      user.oportunidades >= 2 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {user.oportunidades}/3
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      user.estado_resumen?.aprobado ? 'bg-green-100 text-green-800' :
                                      user.estado_resumen?.necesita_atencion ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {user.estado_resumen?.aprobado ? 'Aprobado' :
                                       user.estado_resumen?.necesita_atencion ? 'Requiere Atención' :
                                       'Pendiente'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Actualizar permiso en la base de datos resultados
                                          const response = await apiService.request('admin/manage-jefe-planta-users.php', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                              usuario_id: user.id,
                                              puede_hacer_examen: !user.puede_hacer_examen
                                            })
                                          });
                                          
                                          if (response.success) {
                                            // Actualizar el estado local
                                            setPlantManagerUsers(prev => prev.map(u => 
                                              u.id === user.id 
                                                ? { ...u, puede_hacer_examen: !u.puede_hacer_examen, permiso: u.puede_hacer_examen ? 1 : 0 }
                                                : u
                                            ));
                                            
                                            toast({
                                              title: "✅ Permiso actualizado",
                                              description: `Permiso ${!user.puede_hacer_examen ? 'activado' : 'desactivado'} para ${user.nombre}`
                                            });
                                          }
                                        } catch (error) {
                                          console.error('Error updating permission:', error);
                                          toast({
                                            title: "❌ Error",
                                            description: "No se pudo actualizar el permiso"
                                          });
                                        }
                                      }}
                                      className={`p-2 rounded-lg transition-colors ${
                                        user.puede_hacer_examen
                                          ? 'text-green-600 bg-green-100 hover:bg-red-100 hover:text-red-600'
                                          : 'text-red-600 bg-red-100 hover:bg-green-100 hover:text-green-600'
                                      }`}
                                      title={user.puede_hacer_examen ? 'Desactivar permisos' : 'Activar permisos'}
                                    >
                                      {user.puede_hacer_examen ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <X className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {editingUser === user.id ? (
                                      <div className="flex items-center justify-center space-x-2">
                                        <button
                                          onClick={() => handleSaveUserEdit(user.id)}
                                          className="p-2 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                          title="Guardar cambios"
                                        >
                                          <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                          title="Cancelar edición"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleEditUser(user)}
                                        className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                        title="Editar nombre y empresa"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={() => setShowPlantManagerUsers(false)}
                    className="w-full sm:w-auto"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={loadPlantManagerUsers}
                    variant="outline"
                    className="w-full sm:w-auto sm:mr-3 mt-3 sm:mt-0"
                    disabled={loading}
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPermissionsPanel;
