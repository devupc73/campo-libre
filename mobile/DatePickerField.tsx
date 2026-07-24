import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

function pad(value: number | string) {
  return String(value).padStart(2, '0');
}

function parseDate(value?: string) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function displayDate(value?: string) {
  const date = parseDate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : 'Sin fecha';
}

export default function DatePickerField({ styles, label, value, onChange, minimumYear, maximumYear, quickActions = true }: any) {
  const current = parseDate(value) || new Date();
  const selectedYear = String(current.getFullYear());
  const selectedMonth = String(current.getMonth() + 1);
  const selectedDay = String(current.getDate());
  const startYear = minimumYear || new Date().getFullYear() - 1;
  const endYear = maximumYear || new Date().getFullYear() + 5;

  const yearOptions = useMemo(() => Array.from({ length: endYear - startYear + 1 }, (_, index) => {
    const year = startYear + index;
    return { label: String(year), value: String(year) };
  }), [startYear, endYear]);

  const monthOptions = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ].map((name, index) => ({ label: name, value: String(index + 1) }));

  const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, index) => ({ label: String(index + 1), value: String(index + 1) }));

  function updatePart(part: 'year' | 'month' | 'day', nextValue: string) {
    let year = Number(selectedYear);
    let month = Number(selectedMonth);
    let day = Number(selectedDay);
    if (part === 'year') year = Number(nextValue);
    if (part === 'month') month = Number(nextValue);
    if (part === 'day') day = Number(nextValue);
    const maxDay = new Date(year, month, 0).getDate();
    day = Math.min(day, maxDay);
    onChange(`${year}-${pad(month)}-${pad(day)}`);
  }

  function setRelative(days: number) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    onChange(toIso(date));
  }

  return <View style={{ marginBottom: 12 }}>
    <Text style={styles.moduleText}>{label}</Text>
    <Text style={styles.cardTitle}>{displayDate(value)}</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><ComboSelect styles={styles} label="Día" value={selectedDay} options={dayOptions} onChange={(next: string) => updatePart('day', next)} /></View>
      <View style={{ flex: 2 }}><ComboSelect styles={styles} label="Mes" value={selectedMonth} options={monthOptions} onChange={(next: string) => updatePart('month', next)} /></View>
      <View style={{ flex: 1 }}><ComboSelect styles={styles} label="Año" value={selectedYear} options={yearOptions} onChange={(next: string) => updatePart('year', next)} /></View>
    </View>
    {quickActions && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setRelative(0)}><Text style={styles.buttonText}>Hoy</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setRelative(1)}><Text style={styles.buttonText}>Mañana</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setRelative(7)}><Text style={styles.buttonText}>+7 días</Text></TouchableOpacity>
    </View>}
  </View>;
}
