import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeeklyScheduleCalendar({ styles, courtId }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [dirtySlotIds, setDirtySlotIds] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (courtId) loadSlots();
  }, [courtId]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
      setDirtySlotIds({});
    } catch {
      setMessage('No se pudieron cargar las franjas');
    }
  }

  function findSlot(day: number, hour: number) {
    return slots.find((slot) => {
      const slotHour = Number(String(slot.start_time).split(':')[0]);
      return Number(slot.day_of_week) === day && slotHour === hour;
    });
  }

  function updateSlotLocal(slot: any, changes: any) {
    setSlots((currentSlots) =>
      currentSlots.map((item) =>
        item.id === slot.id
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );
    setDirtySlotIds((current) => ({ ...current, [String(slot.id)]: true }));
    setMessage('Cambios pendientes de guardar');
  }

  function updateDayStatusLocal(day: number, status: 'active' | 'inactive') {
    const daySlots = slots.filter((slot) => Number(slot.day_of_week) === day);

    if (!daySlots.length) {
      setMessage('Primero genera las franjas de la semana.');
      return;
    }

    const updatedDirty: Record<string, boolean> = {};
    daySlots.forEach((slot) => {
      updatedDirty[String(slot.id)] = true;
    });

    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        Number(slot.day_of_week) === day
          ? {
              ...slot,
              status,
            }
          : slot,
      ),
    );
    setDirtySlotIds((current) => ({ ...current, ...updatedDirty }));
    setMessage(status === 'active' ? 'Día activado en pantalla. Guarda los cambios.' : 'Día desactivado en pantalla. Guarda los cambios.');
  }

  async function savePendingChanges() {
    const pendingSlots = slots.filter((slot) => dirtySlotIds[String(slot.id)]);

    if (!pendingSlots.length) {
      setMessage('No hay cambios pendientes');
      return;
    }

    try {
      await Promise.all(
        pendingSlots.map((slot) =>
          fetch(`${API_URL}/court-schedules/${slot.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              court_id: slot.court_id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              price_per_hour: Number(slot.price_per_hour || 0),
              status: slot.status,
            }),
          }),
        ),
      );

      setDirtySlotIds({});
      setMessage('Cambios guardados correctamente en la base de datos');
      loadSlots();
    } catch {
      setMessage('No se pudieron guardar los cambios pendientes');
    }
  }

  async function generateWeek() {
    try {
      for (let day = 1; day <= 7; day += 1) {
        for (let hour = 8; hour < 23; hour += 1) {
          const exists = findSlot(day, hour);
          if (exists) continue;

          await fetch(`${API_URL}/court-schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              court_id: Number(courtId),
              day_of_week: day,
              start_time: `${String(hour).padStart(2, '0')}:00:00`,
              end_time: `${String(hour + 1).padStart(2, '0')}:00:00`,
              price_per_hour: 0,
              status: 'active',
            }),
          });
        }
      }

      setMessage('Semana completa generada');
      loadSlots();
    } catch {
      setMessage('No se pudo generar la semana');
    }
  }

  const activeSlots = slots.filter((slot) => slot.status === 'active');
  const inactiveSlots = slots.filter((slot) => slot.status === 'inactive');
  const potentialRevenue = activeSlots.reduce((sum, slot) => sum + Number(slot.price_per_hour || 0), 0);
  const averageRate = activeSlots.length ? Math.round(potentialRevenue / activeSlots.length) : 0;
  const configuredDays = new Set(slots.map((slot) => Number(slot.day_of_week))).size;
  const pendingChanges = Object.keys(dirtySlotIds).length;

  return (
    <View>
      <Text style={styles.title}>Calendario semanal</Text>
      <Text style={styles.subtitle}>Edita en pantalla y guarda todo al final.</Text>

      <DashboardCards
        styles={styles}
        items={[
          { label: 'Franjas activas', value: activeSlots.length, description: 'Según calendario actual' },
          { label: 'Franjas inactivas', value: inactiveSlots.length, description: 'Bloqueadas o no disponibles' },
          { label: 'Ingreso potencial', value: `S/ ${potentialRevenue}`, description: 'Tarifas activas visibles' },
          { label: 'Tarifa promedio', value: `S/ ${averageRate}`, description: 'Promedio de franjas activas' },
          { label: 'Días configurados', value: configuredDays, description: 'Días con franjas creadas' },
          { label: 'Cambios pendientes', value: pendingChanges, description: 'Aún no guardados en BD' },
        ]}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={generateWeek}>
        <Text style={styles.buttonText}>Generar semana completa</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={savePendingChanges}>
        <Text style={styles.buttonText}>Guardar cambios del calendario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadSlots}>
        <Text style={styles.buttonText}>Descartar cambios y recargar</Text>
      </TouchableOpacity>

      <ScrollView horizontal>
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 90 }}>
              <Text style={styles.moduleTitle}>Hora</Text>
            </View>
            {DAYS.map((day, index) => (
              <View key={day} style={{ width: 150, alignItems: 'center', marginRight: 4 }}>
                <Text style={styles.moduleTitle}>{day}</Text>
                <TouchableOpacity style={[styles.secondaryButton, { paddingVertical: 6, paddingHorizontal: 6, marginTop: 6 }]} onPress={() => updateDayStatusLocal(index + 1, 'inactive')}>
                  <Text style={[styles.buttonText, { fontSize: 11 }]}>Desactivar día</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, { paddingVertical: 6, paddingHorizontal: 6, marginTop: 4 }]} onPress={() => updateDayStatusLocal(index + 1, 'active')}>
                  <Text style={[styles.buttonText, { fontSize: 11 }]}>Activar día</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {Array.from({ length: 15 }).map((_, idx) => {
            const hour = idx + 8;

            return (
              <View key={hour} style={{ flexDirection: 'row', marginTop: 8 }}>
                <View style={{ width: 90, justifyContent: 'center' }}>
                  <Text style={styles.moduleText}>{hourLabel(hour)}</Text>
                </View>

                {DAYS.map((_, dayIndex) => {
                  const slot = findSlot(dayIndex + 1, hour);
                  const isDirty = slot ? dirtySlotIds[String(slot.id)] : false;

                  return (
                    <View
                      key={`${dayIndex}-${hour}`}
                      style={{
                        width: 150,
                        borderWidth: 1,
                        borderColor: isDirty ? '#facc15' : '#334155',
                        padding: 8,
                        marginRight: 4,
                        borderRadius: 10,
                        backgroundColor: slot?.status === 'inactive' ? '#1e293b' : '#0f172a',
                      }}
                    >
                      {slot ? (
                        <>
                          <TextInput
                            style={[styles.input, { marginBottom: 4, padding: 8 }]}
                            value={String(slot.price_per_hour || 0)}
                            onChangeText={(value) => updateSlotLocal(slot, { price_per_hour: Number(value || 0) })}
                            placeholder="Tarifa"
                            placeholderTextColor="#64748b"
                          />

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.moduleText}>{slot.status === 'active' ? 'Activo' : 'Inactivo'}</Text>
                            <Switch
                              value={slot.status === 'active'}
                              onValueChange={(value) => updateSlotLocal(slot, { status: value ? 'active' : 'inactive' })}
                            />
                          </View>
                          {isDirty && <Text style={styles.status}>Pendiente</Text>}
                        </>
                      ) : (
                        <Text style={styles.moduleText}>-</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
