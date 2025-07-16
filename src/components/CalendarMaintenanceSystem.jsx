import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  Wrench, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Save
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CalendarMaintenanceSystem = ({ onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [selectedDate, setSelectedDate] = useState(null);
  const [maintenanceEvents, setMaintenanceEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'maintenance', // 'maintenance' or 'note'
    description: '',
    priority: 'medium', // 'low', 'medium', 'high'
    status: 'pending' // 'pending', 'completed', 'cancelled'
  });

  // Generar años disponibles (5 años hacia adelante y 2 hacia atrás)
  const availableYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    availableYears.push(i);
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cargar eventos del localStorage al iniciar
  useEffect(() => {
    const savedEvents = localStorage.getItem('imcyc_maintenance_events');
    if (savedEvents) {
      try {
        setMaintenanceEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error('Error loading maintenance events:', error);
      }
    }
  }, []);

  // Guardar eventos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('imcyc_maintenance_events', JSON.stringify(maintenanceEvents));
  }, [maintenanceEvents]);

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date) => {
    const dateKey = formatDateKey(date);
    return maintenanceEvents[dateKey] || [];
  };

  // Formatear fecha como clave (YYYY-MM-DD)
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Generar días del mes para vista mensual
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 semanas
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  // Generar meses para vista anual
  const generateYearMonths = () => {
    const year = currentDate.getFullYear();
    const monthsData = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const eventsInMonth = [];
      
      // Contar eventos en este mes
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const events = getEventsForDate(date);
        eventsInMonth.push(...events);
      }
      
      monthsData.push({
        date: monthDate,
        name: months[month],
        eventsCount: eventsInMonth.length,
        maintenanceCount: eventsInMonth.filter(e => e.type === 'maintenance').length,
        notesCount: eventsInMonth.filter(e => e.type === 'note').length
      });
    }
    
    return monthsData;
  };

  // Manejar navegación de fechas
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    
    setCurrentDate(newDate);
  };

  // Manejar clic en fecha
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowEventModal(true);
    setEditingEvent(null);
    setEventForm({
      title: '',
      type: 'maintenance',
      description: '',
      priority: 'medium',
      status: 'pending'
    });
  };

  // Manejar clic en evento existente
  const handleEventClick = (event, date) => {
    setSelectedDate(date);
    setEditingEvent(event);
    setEventForm({ ...event });
    setShowEventModal(true);
  };

  // Guardar evento
  const saveEvent = () => {
    if (!eventForm.title.trim()) {
      toast({
        title: "❌ Error",
        description: "El título es requerido"
      });
      return;
    }

    const dateKey = formatDateKey(selectedDate);
    const newEvent = {
      id: editingEvent?.id || Date.now().toString(),
      ...eventForm,
      createdAt: editingEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setMaintenanceEvents(prev => {
      const updated = { ...prev };
      
      if (!updated[dateKey]) {
        updated[dateKey] = [];
      }
      
      if (editingEvent) {
        // Actualizar evento existente
        const index = updated[dateKey].findIndex(e => e.id === editingEvent.id);
        if (index !== -1) {
          updated[dateKey][index] = newEvent;
        }
      } else {
        // Agregar nuevo evento
        updated[dateKey].push(newEvent);
      }
      
      return updated;
    });

    setShowEventModal(false);
    toast({
      title: "✅ Evento guardado",
      description: `${eventForm.type === 'maintenance' ? 'Mantenimiento' : 'Nota'} guardado exitosamente`
    });
  };

  // Eliminar evento
  const deleteEvent = (eventId, date) => {
    const dateKey = formatDateKey(date);
    
    setMaintenanceEvents(prev => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        updated[dateKey] = updated[dateKey].filter(e => e.id !== eventId);
        if (updated[dateKey].length === 0) {
          delete updated[dateKey];
        }
      }
      return updated;
    });

    toast({
      title: "✅ Evento eliminado",
      description: "El evento ha sido eliminado exitosamente"
    });
  };

  // Obtener color según tipo y prioridad
  const getEventColor = (event) => {
    if (event.type === 'maintenance') {
      switch (event.priority) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-blue-500';
        default: return 'bg-gray-500';
      }
    } else {
      return 'bg-green-500';
    }
  };

  // Obtener icono según tipo
  const getEventIcon = (event) => {
    return event.type === 'maintenance' ? Wrench : FileText;
  };

  // Obtener icono de estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return X;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("public/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Sistema de Mantenimiento y Notas
              </h1>
              <p className="text-white/80">
                Gestiona el mantenimiento y notas de la planta de concreto
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              Volver al Menú
            </Button>
          </div>
        </div>

        {/* Controles de navegación */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigateDate(-1)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </Button>

              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {viewMode === 'monthly' 
                    ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : currentDate.getFullYear()
                  }
                </h2>
              </div>

              <Button
                onClick={() => navigateDate(1)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Selector de año */}
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setCurrentDate(newDate);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Toggle de vista */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'yearly'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Mantenimiento Urgente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Mantenimiento Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Mantenimiento Preventivo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Notas</span>
            </div>
          </div>
        </div>

        {/* Vista del calendario */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {viewMode === 'monthly' ? (
            // Vista mensual
            <div className="p-6">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {generateMonthDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const events = getEventsForDate(date);
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className={`min-h-[100px] p-2 border border-gray-200 rounded cursor-pointer transition-colors ${
                        isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 text-gray-400'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => isCurrentMonth && handleDateClick(date)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                          {date.getDate()}
                        </span>
                        {events.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                            {events.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Eventos del día */}
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event, eventIndex) => {
                          const EventIcon = getEventIcon(event);
                          const StatusIcon = getStatusIcon(event.status);
                          
                          return (
                            <div
                              key={eventIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event, date);
                              }}
                              className={`text-xs p-1 rounded text-white truncate flex items-center space-x-1 ${getEventColor(event)}`}
                            >
                              <EventIcon className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{event.title}</span>
                              <StatusIcon className="w-3 h-3 flex-shrink-0" />
                            </div>
                          );
                        })}
                        {events.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{events.length - 2} más
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Vista anual
            <div className="p-6">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                {generateYearMonths().map((monthData, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setCurrentDate(monthData.date);
                      setViewMode('monthly');
                    }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-3 text-center">
                      {monthData.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total eventos:</span>
                        <span className="font-medium">{monthData.eventsCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Wrench className="w-3 h-3 text-yellow-600" />
                          <span className="text-gray-600">Mantenimiento:</span>
                        </div>
                        <span className="font-medium">{monthData.maintenanceCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-gray-600">Notas:</span>
                        </div>
                        <span className="font-medium">{monthData.notesCount}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar eventos */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
                  </h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-date">Fecha</Label>
                    <Input
                      id="event-date"
                      type="text"
                      value={selectedDate?.toLocaleDateString('es-MX')}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-type">Tipo</Label>
                    <select
                      id="event-type"
                      value={eventForm.type}
                      onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="maintenance">Mantenimiento</option>
                      <option value="note">Nota</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="event-title">Título *</Label>
                    <Input
                      id="event-title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título del evento"
                    />
                  </div>

                  {eventForm.type === 'maintenance' && (
                    <div>
                      <Label htmlFor="event-priority">Prioridad</Label>
                      <select
                        id="event-priority"
                        value={eventForm.priority}
                        onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Baja (Preventivo)</option>
                        <option value="medium">Media (Normal)</option>
                        <option value="high">Alta (Urgente)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="event-status">Estado</Label>
                    <select
                      id="event-status"
                      value={eventForm.status}
                      onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="event-description">Descripción</Label>
                    <textarea
                      id="event-description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción detallada del evento"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  {editingEvent && (
                    <Button
                      onClick={() => {
                        deleteEvent(editingEvent.id, selectedDate);
                        setShowEventModal(false);
                      }}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                  
                  <div className="flex space-x-3 ml-auto">
                    <Button
                      onClick={() => setShowEventModal(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveEvent} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mascota Concreton */}
      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default CalendarMaintenanceSystem;