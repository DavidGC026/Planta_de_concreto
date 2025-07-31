import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lock, Unlock, Clock, User, Eye, Calendar } from 'lucide-react';
import apiService from '@/services/api';

const ExamBlockingManagement = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastEvaluations, setLastEvaluations] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.obtenerTodosLosEstadosExamenes();
      setUsers(usersData);
      
      // Cargar evaluaciones recientes para mostrar calificaciones
      await loadRecentEvaluations(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEvaluations = async (usersData) => {
    try {
      const evaluations = {};
      
      // Obtener la evaluación más reciente de cada usuario
      for (const user of usersData) {
        try {
          const userEvaluations = await apiService.getHistorialEvaluaciones({
            usuario_id: user.usuario_id,
            limit: 1
          });
          
          if (userEvaluations && userEvaluations.length > 0) {
            evaluations[user.usuario_id] = userEvaluations[0];
          }
        } catch (error) {
          console.error(`Error loading evaluation for user ${user.usuario_id}:`, error);
        }
      }
      
      setLastEvaluations(evaluations);
    } catch (error) {
      console.error('Error loading recent evaluations:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!reason.trim()) {
      alert('Por favor ingrese un motivo para el bloqueo');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.bloquearExamen(userId, reason, currentUser.id);
      
      // Recargar usuarios
      await loadUsers();
      
      setSelectedUser(null);
      setReason('');
      
      // Mostrar mensaje de éxito
      alert('Usuario bloqueado exitosamente');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error al bloquear usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!reason.trim()) {
      alert('Por favor ingrese un motivo para el desbloqueo');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.desbloquearExamen(userId, reason, currentUser.id);
      
      // Recargar usuarios
      await loadUsers();
      
      setSelectedUser(null);
      setReason('');
      
      // Mostrar mensaje de éxito
      alert('Usuario desbloqueado exitosamente');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error al desbloquear usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowHistory = async () => {
    try {
      setLoading(true);
      const historyData = await apiService.obtenerHistorialEstadoExamenes();
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-MX');
  };

  const getStatusBadge = (user) => {
    const evaluation = lastEvaluations[user.usuario_id];
    
    if (user.examen_bloqueado) {
      return (
        <div className="flex flex-col items-center space-y-1">
          <Badge variant="destructive" className="flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Bloqueado</span>
          </Badge>
          {evaluation && (
            <div className="text-xs text-gray-600">
              Última calificación: {Math.round(evaluation.puntuacion_ponderada || 0)}%
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-1">
        <Badge variant="secondary" className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Activo</span>
        </Badge>
        {evaluation && (
          <div className="text-xs text-gray-600">
            Última calificación: {Math.round(evaluation.puntuacion_ponderada || 0)}%
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando gestión de exámenes...</p>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Historial de Bloqueos</h1>
            <Button onClick={() => setShowHistory(false)} variant="outline">
              Volver a Gestión
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Realizado por
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.nombre_completo}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{record.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={record.accion === 'BLOQUEAR' ? 'destructive' : 'secondary'}
                            className="flex items-center space-x-1"
                          >
                            {record.accion === 'BLOQUEAR' ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                            <span>{record.accion}</span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {record.motivo || 'Sin motivo especificado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(record.fecha_accion)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.realizado_por_nombre}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Bloqueo de Exámenes</h1>
          <div className="flex space-x-3">
            <Button onClick={handleShowHistory} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Ver Historial
            </Button>
            <Button onClick={onBack} variant="outline">
              Volver al Menú
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de usuarios */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.usuario_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedUser?.usuario_id === user.usuario_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {user.nombre_completo}
                            </h3>
                            <p className="text-sm text-gray-500">
                              @{user.username} • {user.email}
                            </p>
                            {user.examen_bloqueado && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                                <div className="flex items-center text-red-600">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  <span className="font-medium">Bloqueado:</span>
                                </div>
                                <div className="text-red-700 mt-1">
                                  {user.motivo_bloqueo}
                                </div>
                                <div className="text-red-600 text-xs mt-1">
                                  Desde: {formatDate(user.fecha_bloqueo)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(user)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de acciones */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        {selectedUser.nombre_completo}
                      </h4>
                      <p className="text-sm text-gray-600">
                        @{selectedUser.username}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(selectedUser)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="reason">Motivo</Label>
                        <Textarea
                          id="reason"
                          placeholder="Ingrese el motivo del bloqueo/desbloqueo"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex space-x-2">
                        {selectedUser.examen_bloqueado ? (
                          <Button
                            onClick={() => handleUnblockUser(selectedUser.usuario_id)}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Unlock className="w-4 h-4 mr-2" />
                            )}
                            Desbloquear
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBlockUser(selectedUser.usuario_id)}
                            disabled={actionLoading}
                            variant="destructive"
                            className="flex-1"
                          >
                            {actionLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Lock className="w-4 h-4 mr-2" />
                            )}
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Selecciona un usuario para administrar su acceso a exámenes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamBlockingManagement;
