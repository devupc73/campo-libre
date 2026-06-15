import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeeklyScheduleCalendarStable({ styles, courtId }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (courtId) loadSlots();
  }, [courtId]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
      setDirty({});
    } catch {
      setMessage('No se pudieron cargar las franjas');
    }
  }

  function findSlot(day: number, hour: number) {
    return slots.find((slot) => Number(slot.day_of_week) === day && Number(String(slot.start_time).split(':')[0]) === hour);
  }

  function updateLocal(slot: any, changes: any) {
    setSlots((current) => current.map((item) => item.id === slot.id ? { ...item, ...changes } : item));
    setDirty((current) => ({ ...current, [String(slot.id)]: true }));
    setMessage('Cambios pendientes de guardar');
  }

  function updateDay(day: number, status: string) {
    const nextDirty: Record<string, boolean> = {};
    const daySlots = slots.filter((slot) => Number(slot.day_of_week) === day);
    daySlots.forEach((slot) => { nextDirty[String(slot.id)] = true; });
    setSlots((current) => current.map((slot) => Number(slot.day_of_week) === day ? { ...slot, status } : slot));
    setDirty((current) => ({ ...current, ...nextDirty }));
    setMessage('Cambios pendientes de guardar');
  }

  async function saveBatch(items: any[]) {
    const response = await fetch(`${API_URL}/court-schedules-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((slot) => ({
          id: slot.id,
          court_id: Number(slot.court_id || courtId),
          day_of_week: Number(slot.day_of_week),
          start_time: slot.start_time,
          end_time: slot.end_time,
          price_per_hour: Number(slot.price_per_hour || 0),
          status: slot.status || 'active',
        })),
      }),
    });
    if (!response.ok) throw new Error('batch_failed');
  }

  async function savePending() {
    const pending = slots.filter((slot) => dirty[String(slot.id)]);
    if (!pending.length) {
      setMessage('No hay cambios pendientes');
      return;
    }
    try {
      await saveBatch(pending);
      setMessage('Cambios guardados correctamente');
      await loadSlots();
    } catch {
      setMessage('No se pudieron guardar los cambios');
    }
  }

  async function generateWeek() {
    const items: any[] = [];
    for (let day = 1; day <= 7; day += 1) {
      for (let hour = 8; hour < 23; hour += 1) {
        if (findSlot(day, hour)) continue;
        items.push({
          court_id: Number(courtId),
          day_of_week: day,
          start_time: `${String(hour).padStart(2, '0')}:00:00`,
          end_time: `${String(hour + 1).padStart(2, '0')}:00:00`,
          price_per_hour: 0,
          status: 'active',
        });
      }
    }
    try {
      if (items.length) await saveBatch(items);
      setMessage('Semana generada correctamente');
      await loadSlots();
    } catch {
      setMessage('No se pudo generar la semana');
    }
  }

  const active = slots.filter((slot) => slot.status === 'active');
  const inactive = slots.filter((slot) => slot.status === 'inactive');
  const revenue = active.reduce((sum, slot) => sum + Number(slot.price_per_hour || 0), 0);
  const average = active.length ? Math.round(revenue / active.length) : 0;
  const pendingCount = Object.keys(dirty).length;

  return (
    <View>
      <DashboardCards styles={styles} items={[
        { label: 'Activas', value: active.length, description: 'Franjas disponibles' },
        { label: 'Inactivas', value: inactive.length, description: 'Franjas bloqueadas' },
        { label: 'Ingreso potencial', value: `S/ ${revenue}`, description: 'Total activo' },
        { label: 'Tarifa promedio', value: `S/ ${average}`, description: 'Promedio activo' },
        { label: 'Cambios pendientes', value: pendingCount, description: 'Sin guardar' },
      ]} />
      <TouchableOpacity style={styles.primaryButton} onPress={generateWeek}><Text style={styles.buttonText}>Generar semana completa</Text></TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton} onPress={savePending}><Text style={styles.buttonText}>Guardar cambios del calendario</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={loadSlots}><Text style={styles.buttonText}>Recargar calendario</Text></TouchableOpacity>
      <ScrollView horizontal>
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 90 }}><Text style={styles.moduleTitle}>Hora</Text></View>
            {DAYS.map((day, index) => (
              <View key={day} style={{ width: 150, marginRight: 4 }}>
                <Text style={styles.moduleTitle}>{day}</Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDay(index + 1, 'inactive')}><Text style={styles.buttonText}>Off día</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDay(index + 1, 'active')}><Text style={styles.buttonText}>On día</Text></TouchableOpacity>
              </View>
            ))}
          </View>
          {Array.from({ length: 15 }).map((_, idx) => {
            const hour = idx + 8;
            return (
              <View key={hour} style={{ flexDirection: 'row', marginTop: 8 }}>
                <View style={{ width: 90, justifyContent: 'center' }}><Text style={styles.moduleText}>{hourLabel(hour)}</Text></View>
                {DAYS.map((_, dayIndex) => {
                  const slot = findSlot(dayIndex + 1, hour);
                  const isDirty = slot ? dirty[String(slot.id)] : false;
                  return (
                    <View key={`${dayIndex}-${hour}`} style={{ width: 150, borderWidth: 1, borderColor: isDirty ? '#facc15' : '#334155', padding: 8, marginRight: 4, borderRadius: 10 }}>
                      {slot ? (
                        <>
                          <TextInput style={[styles.input, { marginBottom: 4, padding: 8 }]} value={String(slot.price_per_hour || 0)} onChangeText={(value) => updateLocal(slot, { price_per_hour: Number(value || 0) })} placeholder="Tarifa" placeholderTextColor="#64748b" />
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.moduleText}>{slot.status === 'active' ? 'Activo' : 'Inactivo'}</Text>
                            <Switch value={slot.status === 'active'} onValueChange={(value) => updateLocal(slot, { status: value ? 'active' : 'inactive' })} />
                          </View>
                          {isDirty && <Text style={styles.status}>Pendiente</Text>}
                        </>
                      ) : <Text style={styles.moduleText}>-</Text>}
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
