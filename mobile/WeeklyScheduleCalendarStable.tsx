import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const dayOptions = DAYS.map((label, index) => ({ label, value: String(index + 1) }));
const hourOptions = Array.from({ length: 16 }).map((_, index) => {
  const hour = index + 8;
  const label = `${String(hour).padStart(2, '0')}:00`;
  return { label, value: label };
});
const statusOptions = [
  { label: 'No cambiar estado', value: 'unchanged' },
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
];
const reservationOptions = [
  { label: 'No cambiar reserva', value: 'unchanged' },
  { label: 'Marcar como libre', value: 'free' },
  { label: 'Marcar como reservada', value: 'reserved' },
];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeeklyScheduleCalendarStable({ styles, courtId }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [dayFrom, setDayFrom] = useState('1');
  const [dayTo, setDayTo] = useState('7');
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('23:00');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStatus, setBulkStatus] = useState('unchanged');
  const [bulkReservation, setBulkReservation] = useState('unchanged');

  useEffect(() => { if (courtId) loadSlots(); }, [courtId]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
      setDirty({});
    } catch { setMessage('No se pudieron cargar las franjas'); }
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
    slots.filter((slot) => Number(slot.day_of_week) === day).forEach((slot) => { nextDirty[String(slot.id)] = true; });
    setSlots((current) => current.map((slot) => Number(slot.day_of_week) === day ? { ...slot, status } : slot));
    setDirty((current) => ({ ...current, ...nextDirty }));
    setMessage('Cambios pendientes de guardar');
  }

  async function saveBatch(items: any[]) {
    const response = await fetch(`${API_URL}/court-schedules-batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((slot) => ({
        id: slot.id, court_id: Number(slot.court_id || courtId), day_of_week: Number(slot.day_of_week),
        start_time: slot.start_time, end_time: slot.end_time, price_per_hour: Number(slot.price_per_hour || 0),
        status: slot.status || 'active', is_reserved: Boolean(slot.is_reserved),
      })) }),
    });
    if (!response.ok) throw new Error('batch_failed');
  }

  async function savePending() {
    const pending = slots.filter((slot) => dirty[String(slot.id)]);
    if (!pending.length) { setMessage('No hay cambios pendientes'); return; }
    try { await saveBatch(pending); setMessage('Cambios guardados correctamente'); await loadSlots(); }
    catch { setMessage('No se pudieron guardar los cambios'); }
  }

  async function applyBulkUpdate() {
    if (!bulkPrice && bulkStatus === 'unchanged' && bulkReservation === 'unchanged') {
      setMessage('Indica al menos una tarifa, estado o condición de reserva para actualizar.');
      return;
    }
    const payload: any = {
      court_id: Number(courtId), day_from: Number(dayFrom), day_to: Number(dayTo),
      start_time: `${timeFrom}:00`, end_time: `${timeTo}:00`,
    };
    if (bulkPrice !== '') payload.price_per_hour = Number(bulkPrice);
    if (bulkStatus !== 'unchanged') payload.status = bulkStatus;
    if (bulkReservation !== 'unchanged') payload.is_reserved = bulkReservation === 'reserved';

    try {
      const response = await fetch(`${API_URL}/court-schedules-batch/range`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'No se pudo actualizar el rango');
      setMessage(`${data.updated || 0} franja(s) actualizada(s) masivamente.`);
      await loadSlots();
    } catch (error: any) { setMessage(error.message || 'No se pudo actualizar el rango'); }
  }

  async function generateWeek() {
    const items: any[] = [];
    for (let day = 1; day <= 7; day += 1) {
      for (let hour = 8; hour < 23; hour += 1) {
        if (findSlot(day, hour)) continue;
        items.push({ court_id: Number(courtId), day_of_week: day, start_time: `${String(hour).padStart(2, '0')}:00:00`, end_time: `${String(hour + 1).padStart(2, '0')}:00:00`, price_per_hour: 0, status: 'active', is_reserved: false });
      }
    }
    try { if (items.length) await saveBatch(items); setMessage('Semana generada correctamente'); await loadSlots(); }
    catch { setMessage('No se pudo generar la semana'); }
  }

  const active = slots.filter((slot) => slot.status === 'active');
  const inactive = slots.filter((slot) => slot.status === 'inactive');
  const reserved = slots.filter((slot) => slot.is_reserved);
  const available = active.filter((slot) => !slot.is_reserved);
  const revenue = available.reduce((sum, slot) => sum + Number(slot.price_per_hour || 0), 0);
  const average = available.length ? Math.round(revenue / available.length) : 0;

  return <View>
    <DashboardCards styles={styles} items={[
      { label: 'Disponibles', value: available.length, description: 'Activas y libres' },
      { label: 'Reservadas', value: reserved.length, description: 'Franjas ocupadas' },
      { label: 'Inactivas', value: inactive.length, description: 'Franjas bloqueadas' },
      { label: 'Tarifa promedio', value: `S/ ${average}`, description: 'Franjas disponibles' },
      { label: 'Cambios pendientes', value: Object.keys(dirty).length, description: 'Sin guardar' },
    ]} />

    <View style={{ backgroundColor: '#10243a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2b4967', marginTop: 16 }}>
      <Text style={styles.cardTitle}>Actualización masiva de franjas</Text>
      <Text style={styles.moduleText}>Selecciona un rango de días y horas. Solo se modificarán las franjas existentes dentro del rango.</Text>
      <ComboSelect styles={styles} label="Día inicial" value={dayFrom} options={dayOptions} onChange={setDayFrom} />
      <ComboSelect styles={styles} label="Día final" value={dayTo} options={dayOptions} onChange={setDayTo} />
      <ComboSelect styles={styles} label="Hora inicial" value={timeFrom} options={hourOptions.slice(0, -1)} onChange={setTimeFrom} />
      <ComboSelect styles={styles} label="Hora final" value={timeTo} options={hourOptions.slice(1)} onChange={setTimeTo} />
      <TextInput style={styles.input} placeholder="Nueva tarifa por hora (opcional)" placeholderTextColor="#718198" keyboardType="numeric" value={bulkPrice} onChangeText={setBulkPrice} />
      <ComboSelect styles={styles} label="Estado" value={bulkStatus} options={statusOptions} onChange={setBulkStatus} />
      <ComboSelect styles={styles} label="Reserva" value={bulkReservation} options={reservationOptions} onChange={setBulkReservation} />
      <TouchableOpacity style={styles.primaryButton} onPress={applyBulkUpdate}><Text style={styles.buttonText}>Aplicar actualización masiva</Text></TouchableOpacity>
    </View>

    <TouchableOpacity style={styles.primaryButton} onPress={generateWeek}><Text style={styles.buttonText}>Generar semana completa</Text></TouchableOpacity>
    <TouchableOpacity style={styles.primaryButton} onPress={savePending}><Text style={styles.buttonText}>Guardar cambios del calendario</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={loadSlots}><Text style={styles.buttonText}>Recargar calendario</Text></TouchableOpacity>

    <ScrollView horizontal><View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row' }}><View style={{ width: 110 }}><Text style={styles.moduleTitle}>Hora</Text></View>{DAYS.map((day, index) => <View key={day} style={{ width: 170, marginRight: 4 }}><Text style={styles.moduleTitle}>{day}</Text><TouchableOpacity style={styles.secondaryButton} onPress={() => updateDay(index + 1, 'inactive')}><Text style={styles.buttonText}>Off día</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => updateDay(index + 1, 'active')}><Text style={styles.buttonText}>On día</Text></TouchableOpacity></View>)}</View>
      {Array.from({ length: 15 }).map((_, idx) => {
        const hour = idx + 8;
        return <View key={hour} style={{ flexDirection: 'row', marginTop: 8 }}><View style={{ width: 110, justifyContent: 'center' }}><Text style={styles.moduleText}>{hourLabel(hour)}</Text></View>{DAYS.map((_, dayIndex) => {
          const slot = findSlot(dayIndex + 1, hour);
          const isDirty = slot ? dirty[String(slot.id)] : false;
          return <View key={`${dayIndex}-${hour}`} style={{ width: 170, borderWidth: 1, borderColor: isDirty ? '#facc15' : slot?.is_reserved ? '#dc2626' : '#334155', padding: 8, marginRight: 4, borderRadius: 10 }}>
            {slot ? <>
              <TextInput style={[styles.input, { marginBottom: 4, padding: 8 }]} value={String(slot.price_per_hour || 0)} onChangeText={(value) => updateLocal(slot, { price_per_hour: Number(value || 0) })} placeholder="Tarifa" placeholderTextColor="#64748b" />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={styles.moduleText}>{slot.status === 'active' ? 'Activo' : 'Inactivo'}</Text><Switch value={slot.status === 'active'} onValueChange={(value) => updateLocal(slot, { status: value ? 'active' : 'inactive' })} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={styles.moduleText}>{slot.is_reserved ? 'Reservada' : 'Libre'}</Text><Switch value={Boolean(slot.is_reserved)} onValueChange={(value) => updateLocal(slot, { is_reserved: value })} /></View>
              {isDirty && <Text style={styles.status}>Pendiente</Text>}
            </> : <Text style={styles.moduleText}>-</Text>}
          </View>;
        })}</View>;
      })}
    </View></ScrollView>
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
