import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const viewOptions = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
];

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function rangeFor(view: string, anchor: string) {
  const base = parseLocalDate(anchor);
  let start = new Date(base);
  let end = new Date(base);
  if (view === 'week') {
    const offset = (base.getDay() + 6) % 7;
    start.setDate(base.getDate() - offset);
    end = new Date(start); end.setDate(start.getDate() + 6);
  } else if (view === 'month') {
    start = new Date(base.getFullYear(), base.getMonth(), 1, 12);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 12);
  } else if (view === 'year') {
    start = new Date(base.getFullYear(), 0, 1, 12);
    end = new Date(base.getFullYear(), 11, 31, 12);
  }
  return { dateFrom: isoDate(start), dateTo: isoDate(end) };
}

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

export default function DateScheduleCalendar({ styles, courtId }: any) {
  const today = isoDate(new Date());
  const [view, setView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(today);
  const [slots, setSlots] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('23:00');
  const [price, setPrice] = useState('0');

  const visibleRange = useMemo(() => rangeFor(view, anchorDate), [view, anchorDate]);

  useEffect(() => { if (courtId) loadSlots(); }, [courtId, visibleRange.dateFrom, visibleRange.dateTo]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}&date_from=${visibleRange.dateFrom}&date_to=${visibleRange.dateTo}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
      setMessage('');
    } catch { setMessage('No se pudo cargar el calendario por fechas.'); }
  }

  async function generateRange() {
    if (!dateFrom || !dateTo) { setMessage('Indica las fechas inicial y final.'); return; }
    try {
      const response = await fetch(`${API_URL}/court-schedules-batch/generate-date-range`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: Number(courtId), date_from: dateFrom, date_to: dateTo, start_time: `${startTime}:00`, end_time: `${endTime}:00`, price_per_hour: Number(price || 0) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'No se pudo generar la disponibilidad');
      setAnchorDate(dateFrom); setMessage(`${data.created || 0} franjas creadas con fecha específica.`); await loadSlots();
    } catch (error: any) { setMessage(error.message || 'No se pudo generar la disponibilidad.'); }
  }

  async function saveSlot(slot: any, changes: any) {
    const updated = { ...slot, ...changes };
    setSlots((current) => current.map((item) => item.id === slot.id ? updated : item));
    try {
      const response = await fetch(`${API_URL}/court-schedules/${slot.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: Number(slot.court_id), calendar_date: slot.calendar_date, day_of_week: Number(slot.day_of_week),
          start_time: slot.start_time, end_time: slot.end_time, price_per_hour: Number(updated.price_per_hour || 0),
          status: updated.status || 'active', is_reserved: Boolean(updated.is_reserved),
        }),
      });
      if (!response.ok) throw new Error();
      setMessage('Franja actualizada.');
    } catch { setMessage('No se pudo guardar la franja.'); await loadSlots(); }
  }

  const active = slots.filter((slot) => slot.status === 'active');
  const reserved = active.filter((slot) => slot.is_reserved);
  const available = active.filter((slot) => !slot.is_reserved);
  const potential = active.reduce((sum, slot) => sum + Number(slot.price_per_hour || 0), 0);

  return <View>
    <DashboardCards styles={styles} items={[
      { label: 'Periodo', value: `${visibleRange.dateFrom} / ${visibleRange.dateTo}`, description: view },
      { label: 'Franjas activas', value: active.length, description: 'Fechas específicas' },
      { label: 'Disponibles', value: available.length, description: 'Activas y libres' },
      { label: 'Reservadas', value: reserved.length, description: 'Activas y ocupadas' },
      { label: 'Ingreso potencial', value: money(potential), description: 'Periodo consultado' },
    ]} />

    <View style={{ marginTop: 16 }}>
      <ComboSelect styles={styles} label="Vista de control" value={view} options={viewOptions} onChange={setView} />
      <Text style={styles.moduleText}>Fecha de referencia</Text>
      <TextInput style={styles.input} value={anchorDate} onChangeText={setAnchorDate} placeholder="AAAA-MM-DD" placeholderTextColor="#718198" />
      <TouchableOpacity style={styles.secondaryButton} onPress={loadSlots}><Text style={styles.buttonText}>Consultar periodo</Text></TouchableOpacity>
    </View>

    <View style={{ backgroundColor: '#10243a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2b4967', marginTop: 16 }}>
      <Text style={styles.cardTitle}>Generar disponibilidad por fechas</Text>
      <Text style={styles.moduleText}>Puedes crear disponibilidad día por día para un rango máximo de 366 días.</Text>
      <TextInput style={styles.input} value={dateFrom} onChangeText={setDateFrom} placeholder="Fecha inicial AAAA-MM-DD" placeholderTextColor="#718198" />
      <TextInput style={styles.input} value={dateTo} onChangeText={setDateTo} placeholder="Fecha final AAAA-MM-DD" placeholderTextColor="#718198" />
      <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="Hora inicial HH:MM" placeholderTextColor="#718198" />
      <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="Hora final HH:MM" placeholderTextColor="#718198" />
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Tarifa por hora" placeholderTextColor="#718198" keyboardType="numeric" />
      <TouchableOpacity style={styles.primaryButton} onPress={generateRange}><Text style={styles.buttonText}>Generar calendario fechado</Text></TouchableOpacity>
    </View>

    {!slots.length && <Text style={styles.status}>No existen franjas con fecha específica en el periodo consultado.</Text>}
    <ScrollView style={{ maxHeight: 720, marginTop: 16 }}>
      {slots.map((slot) => <View key={slot.id} style={styles.moduleButton}>
        <Text style={styles.cardTitle}>{slot.calendar_date || 'Plantilla semanal'} · {String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}</Text>
        <Text style={styles.moduleText}>Día de semana: {slot.day_of_week}</Text>
        <TextInput style={styles.input} value={String(slot.price_per_hour || 0)} onChangeText={(value) => setSlots((current) => current.map((item) => item.id === slot.id ? { ...item, price_per_hour: value } : item))} onBlur={() => saveSlot(slot, { price_per_hour: Number(slots.find((item) => item.id === slot.id)?.price_per_hour || 0) })} keyboardType="numeric" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={styles.moduleText}>Activa</Text><Switch value={slot.status === 'active'} onValueChange={(value) => saveSlot(slot, { status: value ? 'active' : 'inactive' })} /></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={styles.moduleText}>Reservada</Text><Switch value={Boolean(slot.is_reserved)} onValueChange={(value) => saveSlot(slot, { is_reserved: value })} /></View>
      </View>)}
    </ScrollView>
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
