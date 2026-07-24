import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';
import DatePickerField from './DatePickerField';
import TimePickerField from './TimePickerField';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const viewOptions = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
];

function isoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function displayDate(value: string) {
  const date = parseLocalDate(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
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
  const groupedSlots = useMemo(() => slots.reduce((groups: Record<string, any[]>, slot: any) => {
    const key = slot.calendar_date || 'Plantillas semanales';
    groups[key] = [...(groups[key] || []), slot];
    return groups;
  }, {}), [slots]);

  useEffect(() => { if (courtId) loadSlots(); }, [courtId, visibleRange.dateFrom, visibleRange.dateTo]);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}&date_from=${visibleRange.dateFrom}&date_to=${visibleRange.dateTo}`);
      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
      setMessage('');
    } catch { setMessage('No se pudo cargar el calendario.'); }
  }

  function applyPreset(days: number) {
    const start = parseLocalDate(dateFrom);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);
    setDateTo(isoDate(end));
  }

  async function generateRange() {
    if (!dateFrom || !dateTo) { setMessage('Selecciona las fechas inicial y final.'); return; }
    if (startTime >= endTime) { setMessage('La hora final debe ser posterior a la hora inicial.'); return; }
    try {
      const response = await fetch(`${API_URL}/court-schedules-batch/generate-date-range`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: Number(courtId), date_from: dateFrom, date_to: dateTo, start_time: `${startTime}:00`, end_time: `${endTime}:00`, price_per_hour: Number(price || 0) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'No se pudo generar la disponibilidad');
      setAnchorDate(dateFrom); setMessage(`${data.created || 0} franjas creadas.`); await loadSlots();
    } catch (error: any) { setMessage(error.message || 'No se pudo generar la disponibilidad.'); }
  }

  async function saveSlot(slot: any, changes: any) {
    if (slot.is_reserved && (changes.status || changes.is_reserved === false)) {
      setMessage('Una franja reservada se libera desde la reserva o validación correspondiente.');
      return;
    }
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
      setMessage('Cambio guardado.');
    } catch { setMessage('No se pudo guardar la franja.'); await loadSlots(); }
  }

  const active = slots.filter((slot) => slot.status === 'active');
  const reserved = active.filter((slot) => slot.is_reserved);
  const available = active.filter((slot) => !slot.is_reserved);
  const potential = active.reduce((sum, slot) => sum + Number(slot.price_per_hour || 0), 0);

  return <View>
    <DashboardCards styles={styles} items={[
      { label: 'Periodo', value: `${displayDate(visibleRange.dateFrom)} - ${displayDate(visibleRange.dateTo)}`, description: viewOptions.find((item) => item.value === view)?.label },
      { label: 'Disponibles', value: available.length, description: 'Activas y libres' },
      { label: 'Reservadas', value: reserved.length, description: 'No editables manualmente' },
      { label: 'Ingreso potencial', value: money(potential), description: 'Periodo consultado' },
    ]} />

    <View style={{ marginTop: 16 }}>
      <Text style={styles.cardTitle}>1. Consulta el calendario</Text>
      <ComboSelect styles={styles} label="Vista" value={view} options={viewOptions} onChange={setView} />
      <DatePickerField styles={styles} label="Fecha de referencia" value={anchorDate} onChange={setAnchorDate} />
    </View>

    <View style={{ backgroundColor: '#10243a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2b4967', marginTop: 16 }}>
      <Text style={styles.cardTitle}>2. Crea disponibilidad</Text>
      <Text style={styles.moduleText}>Selecciona fechas, horario y tarifa. El sistema crea automáticamente una franja por cada hora y día.</Text>
      <DatePickerField styles={styles} label="Desde" value={dateFrom} onChange={setDateFrom} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => { setDateTo(dateFrom); }}><Text style={styles.buttonText}>Solo ese día</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => applyPreset(7)}><Text style={styles.buttonText}>7 días</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => applyPreset(30)}><Text style={styles.buttonText}>30 días</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => applyPreset(365)}><Text style={styles.buttonText}>365 días</Text></TouchableOpacity>
      </View>
      <DatePickerField styles={styles} label="Hasta" value={dateTo} onChange={setDateTo} quickActions={false} />
      <TimePickerField styles={styles} label="Hora de apertura" value={startTime} onChange={setStartTime} />
      <TimePickerField styles={styles} label="Hora de cierre" value={endTime} onChange={setEndTime} />
      <Text style={styles.moduleText}>Tarifa por hora</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Ejemplo: 120" placeholderTextColor="#718198" keyboardType="numeric" />
      <TouchableOpacity style={styles.primaryButton} onPress={generateRange}><Text style={styles.buttonText}>Crear disponibilidad</Text></TouchableOpacity>
    </View>

    <Text style={[styles.cardTitle, { marginTop: 20 }]}>3. Revisa y ajusta</Text>
    {!slots.length && <Text style={styles.status}>No existen franjas para el periodo seleccionado.</Text>}
    <ScrollView style={{ maxHeight: 720, marginTop: 8 }}>
      {Object.entries(groupedSlots).map(([date, dateSlots]) => <View key={date} style={{ marginBottom: 16 }}>
        <Text style={styles.title}>{date === 'Plantillas semanales' ? date : displayDate(date)}</Text>
        {(dateSlots as any[]).map((slot) => <View key={slot.id} style={styles.moduleButton}>
          <Text style={styles.cardTitle}>{String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}</Text>
          <Text style={styles.moduleText}>{slot.is_reserved ? '🔒 Reservada' : slot.status === 'active' ? '✅ Disponible' : '⛔ Inactiva'}</Text>
          <Text style={styles.moduleText}>Tarifa por hora</Text>
          <TextInput style={styles.input} value={String(slot.price_per_hour || 0)} editable={!slot.is_reserved} onChangeText={(value) => setSlots((current) => current.map((item) => item.id === slot.id ? { ...item, price_per_hour: value } : item))} onBlur={() => saveSlot(slot, { price_per_hour: Number(slots.find((item) => item.id === slot.id)?.price_per_hour || 0) })} keyboardType="numeric" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.moduleText}>{slot.status === 'active' ? 'Activa' : 'Inactiva'}</Text>
            <Switch disabled={slot.is_reserved} value={slot.status === 'active'} onValueChange={(value) => saveSlot(slot, { status: value ? 'active' : 'inactive' })} />
          </View>
        </View>)}
      </View>)}
    </ScrollView>
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
