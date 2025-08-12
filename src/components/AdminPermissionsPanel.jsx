import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Shield, Users, Check, X, Plus, AlertTriangle, Settings, ClipboardCheck, UserCheck, GraduationCap, UserPlus, Search, Filter, Link as LinkIcon, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import permissionsService from '@/services/permissionsService';
import apiService from '@/services/api';

const AdminPermissionsPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlantManagerUsers, setShowPlantManagerUsers] = useState(false);
  const [plantManagerUsers, setPlantManagerUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", empresa: "" });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    nombre_completo: "",
    email: "",
    rol: "evaluador"
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tokens, setTokens] = useState([]);
  const [newTokenForm, setNewTokenForm] = useState({ page_slug: '', tipo_evaluacion: 'equipo', expires_in_days: '', expires_at: '', never: true });
  const [resultadosUsers, setResultadosUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);
  const loadTokens = async () => {
    try {
      const list = await apiService.listarTokensPermanentes();
      setTokens(Array.isArray(list) ? list : []);
    } catch (e) {
      setTokens([]);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const loadResultadosUsers = async () => {
    try {
      const list = await apiService.listarResultadosUsuarios();
      setResultadosUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setResultadosUsers([]);
    }
  };

  const handleCreatePermanentToken = async () => {
    if (!newTokenForm.page_slug.trim()) {
      toast({ title: '❌ Error', description: 'Ingresa el nombre de la página' });
      return;
    }
    try {
      const res = await apiService.crearTokenPermanente(
        newTokenForm.page_slug.trim(),
        newTokenForm.tipo_evaluacion,
        newTokenForm.expires_in_days ? parseInt(newTokenForm.expires_in_days, 10) : null,
        newTokenForm.expires_at || null,
        newTokenForm.never === true
      );
      await loadTokens();
      toast({ title: '✅ Token creado', description: 'Enlace permanente generado' });
    } catch (e) {
      toast({ title: '❌ Error', description: 'No se pudo crear el token' });
    }
  };

  const handleDisablePermanentToken = async (token) => {
    try {
      await apiService.desactivarTokenPermanente(token);
      await loadTokens();
      toast({ title: '✅ Token desactivado' });
    } catch (e) {
      toast({ title: '❌ Error', description: 'No se pudo desactivar el token' });
    }
  };

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
    const usersWithFullAccess = users.filter(user => user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')).length;

    const usersWithRestrictions = users.filter(user => {
      // Si tiene permisos completos o es admin, no es restringido
      if (user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')) return false;

      const personalPerms = getUserPersonalPermissions(user.id).length;
      const equipmentPerm = hasEquipmentPermission(user.id);
      const operationPerm = hasOperationPermission(user.id);

      // Incluir supervisores y usuarios con permisos específicos
      return user.rol === 'supervisor' || personalPerms > 0 || equipmentPerm || operationPerm;
    }).length;

    return {
      totalUsers,
      usersWithRestrictions,
      usersWithFullAccess,
      usersWithoutAccess: totalUsers - usersWithRestrictions - usersWithFullAccess
    };
  };

  const stats = getPermissionStats();

  // Función para cargar usuarios de jefe de planta
  const loadPlantManagerUsers = async () => {
    try {
      setLoading(true);
      // Obtener usuarios que han hecho la evaluación de jefe de planta
      const response = await apiService.request("evaluaciones-jefe/usuarios-con-evaluacion.php");
      setPlantManagerUsers(Array.isArray(response?.data) ? response.data : []);
      setShowPlantManagerUsers(true);

      toast({
        title: "✅ Datos cargados",
        description: "Se han cargado los usuarios que han realizado evaluaciones de jefe de planta"
      });

    } catch (error) {
      console.error("Error loading plant manager users:", error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los usuarios que han hecho evaluaciones de jefe de planta"
      });
      setPlantManagerUsers([]);
    } finally {
      setLoading(false);
    }
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

      const response = await apiService.request("admin/create-user.php", {
        method: "POST",
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
          username: "",
          password: "",
          confirmPassword: "",
          nombre_completo: "",
          email: "",
          rol: "evaluador"
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
      console.error("Error creating user:", error);
      toast({
        title: "❌ Error",
        description: "Error interno del servidor"
      });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50" />
            <div className="relative px-6 py-6 flex items-center justify-between">
              <div className="flex items-start">
                <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-200">
                  <Shield className="w-7 h-7 text-blue-700" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Panel de Permisos de Usuario</h1>
                  <p className="text-slate-600 mt-1">Gestiona accesos y roles para evaluaciones</p>
                </div>
              </div>
              <Button onClick={onBack} variant="outline" className="bg-white/70 backdrop-blur border-slate-300">
                Volver al Menú
              </Button>
            </div>
          </div>
        </div>

        {/* Botones de administración de usuarios */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex gap-3">
            <Button
              onClick={loadPlantManagerUsers}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Permisos Jefe de Planta
            </Button>
                        <Button
              onClick={loadResultadosUsers}
              variant="outline"
              className="border-slate-300"
            >
              Permisos Jefe de Planta (Resultados)
            </Button>
          </div>

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
          <Card className="bg-white/90 border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <Shield className="w-6 h-6 text-green-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Acceso Completo</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.usersWithFullAccess}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertTriangle className="w-6 h-6 text-yellow-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Acceso Restringido</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.usersWithRestrictions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <X className="w-6 h-6 text-red-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Sin Acceso</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.usersWithoutAccess}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de permisos */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white/70 backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>Matriz de Permisos por Usuario</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar por nombre o usuario"
                    className="pl-9 w-64"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="evaluador">Evaluador</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-slate-50/80 backdrop-blur">
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
                  {(users
                    .filter(u => {
                      const text = searchText.trim().toLowerCase();
                      if (!text) return true;
                      return (
                        u.nombre_completo?.toLowerCase().includes(text) ||
                        u.username?.toLowerCase().includes(text) ||
                        u.email?.toLowerCase().includes(text)
                      );
                    })
                    .filter(u => roleFilter === 'all' ? true : u.rol === roleFilter)
                  ).map(user => {
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
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 mr-3">
                              {user.nombre_completo?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.nombre_completo}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor') ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : user.rol === 'supervisor' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              <Users className="w-3 h-3 mr-1" />
                              Supervisor
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Users className="w-3 h-3 mr-1" />
                              Restringido
                            </span>
                          )}
                        </td>

                        {/* Permisos de Personal */}
                        {roles.map(role => (
                          <td key={role.codigo} className="p-2 text-center">
                            {(user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')) ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                {hasPersonalPermission(user.id, role.codigo) ? (
                                  <button
                                    onClick={() => handleRemovePersonalPermission(user.id, role.codigo)}
                                    className="p-1 text-green-600 hover:text-red-600 transition-colors rounded"
                                    title="Quitar permiso"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignPersonalPermission(user.id, role.codigo)}
                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors rounded"
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
                          {(user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')) ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <button
                              onClick={() => handleToggleEquipmentPermission(user.id, hasEquipment)}
                              className={`p-2 rounded-lg transition-colors border ${
                                hasEquipment
                                  ? 'text-green-700 bg-green-50 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                  : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                              }`}
                              title={hasEquipment ? "Quitar permiso de equipo" : "Asignar permiso de equipo"}
                            >
                              {hasEquipment ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </td>

                        {/* Permisos de Operación */}
                        <td className="p-4 text-center">
                          {(user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')) ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <button
                              onClick={() => handleToggleOperationPermission(user.id, hasOperation)}
                              className={`p-2 rounded-lg transition-colors border ${
                                hasOperation
                                  ? 'text-green-700 bg-green-50 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                  : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                              }`}
                              title={hasOperation ? "Quitar permiso de operación" : "Asignar permiso de operación"}
                            >
                              {hasOperation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {(user.rol === 'admin' || (user.permisos_completos && user.rol !== 'supervisor')) ? roles.length + 2 : totalPermissions}
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

        {/* Tokens permanentes SSO */}
        <Card className="mt-8 border border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white/70 backdrop-blur">
            <CardTitle>Enlaces permanentes de acceso (SSO)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la página (slug)</label>
                    <Input value={newTokenForm.page_slug} onChange={(e) => setNewTokenForm(prev => ({ ...prev, page_slug: e.target.value }))} placeholder="ej. cursos-imcyc" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de evaluación</label>
                    <select value={newTokenForm.tipo_evaluacion} onChange={(e)=> setNewTokenForm(prev => ({ ...prev, tipo_evaluacion: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm">
                      <option value="equipo">Equipo</option>
                      <option value="personal">Personal</option>
                      <option value="operacion">Operación</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="never-expire" type="checkbox" checked={newTokenForm.never}
                      onChange={(e)=> setNewTokenForm(prev => ({ ...prev, never: e.target.checked }))}
                    />
                    <label htmlFor="never-expire" className="text-sm text-slate-700">Nunca expira</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expira en (días)</label>
                      <Input type="number" min="1" placeholder="opcional" value={newTokenForm.expires_in_days} onChange={(e)=> setNewTokenForm(prev=> ({ ...prev, expires_in_days: e.target.value }))} disabled={newTokenForm.never} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expira el (fecha/hora)</label>
                      <Input type="datetime-local" value={newTokenForm.expires_at} onChange={(e)=> setNewTokenForm(prev => ({ ...prev, expires_at: e.target.value }))} disabled={newTokenForm.never} />
                    </div>
                  </div>
                  <Button onClick={handleCreatePermanentToken} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <LinkIcon className="w-4 h-4 mr-2" /> Crear enlace permanente
                  </Button>
                  <p className="text-xs text-slate-500">El enlace permitirá acceso vía SSO sin firma. Recomendado vincular desde dominios de confianza.</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3 text-sm font-semibold">Página</th>
                        <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                        <th className="text-left p-3 text-sm font-semibold">URL</th>
                        <th className="text-left p-3 text-sm font-semibold">Expira</th>
                        <th className="text-center p-3 text-sm font-semibold">Estado</th>
                        <th className="text-center p-3 text-sm font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500">Sin enlaces creados</td>
                        </tr>
                      ) : (
                        tokens.map((t) => {
                          const url = `${window.location.origin}/plantaconcreto/?sso=1&perm=${encodeURIComponent(t.token)}&type=${encodeURIComponent(t.tipo_evaluacion || 'equipo')}`;
                          return (
                            <tr key={t.token} className="border-b hover:bg-slate-50">
                              <td className="p-3 text-slate-800 font-medium">{t.page_slug}</td>
                              <td className="p-3 text-slate-700">{t.tipo_evaluacion || 'equipo'}</td>
                              <td className="p-3">
                                <div className="text-xs break-all bg-slate-50 border border-slate-200 rounded px-2 py-1 flex items-center justify-between gap-2">
                                  <span className="truncate">{url}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="text-slate-700 border-slate-200 hover:bg-slate-100 h-7 px-2"
                                    onClick={async () => { try { await navigator.clipboard.writeText(url); toast({ title: '📋 Copiado', description: 'URL copiada al portapapeles' }); } catch(e) {} }}
                                  >
                                    Copiar
                                  </Button>
                                </div>
                              </td>
                          <td className="p-3 text-slate-700 text-sm">{t.expires_at ? new Date(t.expires_at).toLocaleString() : 'Nunca'}</td>
                              <td className="p-3 text-center">
                                {parseInt(t.activo, 10) === 1 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Activo</span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Inactivo</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {parseInt(t.activo, 10) === 1 && (
                                  <Button onClick={() => handleDisablePermanentToken(t.token)} variant="outline" className="text-red-700 border-red-200 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Desactivar
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permisos Jefe de Planta - BD Resultados */}
        {resultadosUsers.length > 0 && (
          <Card className="mt-8 border border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-white/70 backdrop-blur">
              <CardTitle>Permisos Jefe de Planta (Plataforma Resultados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 text-sm font-semibold">Nombre</th>
                      <th className="text-left p-3 text-sm font-semibold">Email</th>
                      <th className="text-left p-3 text-sm font-semibold">Empresa</th>
                      <th className="text-center p-3 text-sm font-semibold">Permiso</th>
                      <th className="text-center p-3 text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosUsers.map(u => (
                      <tr key={u.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-slate-800">{u.nombre}</td>
                        <td className="p-3 text-slate-700 text-sm">{u.email}</td>
                        <td className="p-3 text-slate-700 text-sm">{u.empresa || '—'}</td>
                        <td className="p-3 text-center">
                          {parseInt(u.permiso, 10) === 1 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Bloqueado</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Permitido</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            className={`border-slate-300 ${parseInt(u.permiso, 10) === 1 ? 'hover:bg-green-50' : 'hover:bg-red-50'}`}
                            onClick={async () => {
                              const nuevo = parseInt(u.permiso, 10) === 1 ? 0 : 1;
                              try {
                                await apiService.actualizarResultadosPermiso(u.id, nuevo);
                                toast({ title: '✅ Guardado', description: 'Permiso actualizado' });
                                await loadResultadosUsers();
                              } catch (e) {
                                toast({ title: '❌ Error', description: 'No se pudo actualizar' });
                              }
                            }}
                          >
                            {parseInt(u.permiso, 10) === 1 ? 'Desbloquear' : 'Bloquear'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50/70 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Información sobre Permisos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Tipos de Usuario:</h4>
              <ul className="space-y-1">
                <li>• <strong>Admin:</strong> Acceso completo a todas las evaluaciones</li>
                <li>• <strong>Supervisor:</strong> Acceso intermedio con permisos supervisoriales</li>
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
                    {loading ? "Creando..." : "Crear Usuario"}
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

                      {/* Contenido del modal */}
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
                          <div className="space-y-4">
                            {plantManagerUsers.map((user, index) => (
                              <div key={user.id} className="border rounded-lg p-4">
                                <h4 className="font-semibold">{user.nombre}</h4>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <p className="text-sm text-gray-500">Evaluaciones: {user.total_evaluaciones || 0}</p>
                              </div>
                            ))}
                          </div>
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
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminPermissionsPanel;
