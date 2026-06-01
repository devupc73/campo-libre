import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeeklyScheduleCalendar({ styles, courtId }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (courtId) loadSlots();
  }, [courtId]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
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

  async function updateSlot(slot: any, changes: any) {
    try {
      await fetch(`${API_URL}/court-schedules/${slot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: slot.court_id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price_per_hour: changes.price_per_hour ?? slot.price_per_hour,
          status: changes.status ?? slot.status,
        }),
      });

      loadSlots();
    } catch {
      setMessage('No se pudo actualizar la franja');
    }
  }

  async function updateDayStatus(day: number, status: 'active' | 'inactive') {
    const daySlots = slots.filter((slot) => Number(slot.day_of_week) === day);

    if (!daySlots.length) {
      setMessage('Primero genera las franjas de la semana.');
      return;
    }

    try {
      await Promise.all(
        daySlots.map((slot) =>
          fetch(`${API_URL}/court-schedules/${slot.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              court_id: slot.court_id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              price_per_hour: slot.price_per_hour,
              status,
            }),
          }),
        ),
      );

      setMessage(status === 'active' ? 'Día activado correctamente' : 'Día desactivado correctamente');
      loadSlots();
    } catch {
      setMessage('No se pudo actualizar el día completo');
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

  return (
    <View>
      <Text style={styles.title}>Calendario semanal</Text>
      <Text style={styles.subtitle}>Administra disponibilidad y tarifas por día y hora.</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={generateWeek}>
        <Text style={styles.buttonText}>Generar semana completa</Text>
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
                <TouchableOpacity style={[styles.secondaryButton, { paddingVertical: 6, paddingHorizontal: 6, marginTop: 6 }]} onPress={() => updateDayStatus(index + 1, 'inactive')}>
                  <Text style={[styles.buttonText, { fontSize: 11 }]}>Desactivar día</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, { paddingVertical: 6, paddingHorizontal: 6, marginTop: 4 }]} onPress={() => updateDayStatus(index + 1, 'active')}>
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

                  return (
                    <View
                      key={`${dayIndex}-${hour}`}
                      style={{
                        width: 150,
                        borderWidth: 1,
                        borderColor: '#334155',
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
                            onChangeText={(value) => updateSlot(slot, { price_per_hour: Number(value || 0) })}
                            placeholder="Tarifa"
                            placeholderTextColor="#64748b"
                          />

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.moduleText}>{slot.status === 'active' ? 'Activo' : 'Inactivo'}</Text>
                            <Switch
                              value={slot.status === 'active'}
                              onValueChange={(value) => updateSlot(slot, { status: value ? 'active' : 'inactive' })}
                            />
                          </View>
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
