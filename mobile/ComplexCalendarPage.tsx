import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import ComboSelect from './ComboSelect';
import WeeklyScheduleCalendarStable from './WeeklyScheduleCalendarStable';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexCalendarPage({ styles, selectedComplex, courtId, onSelectCourt }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCourts();
  }, [selectedComplex?.id]);

  async function loadCourts() {
    if (!selectedComplex?.id) {
      setCourts([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/courts/?complex_id=${selectedComplex.id}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const availableCourts = Array.isArray(data) ? data : [];
      setCourts(availableCourts);

      if (courtId && !availableCourts.some((court) => String(court.id) === String(courtId))) {
        onSelectCourt('');
      }
    } catch {
      setCourts([]);
      setMessage('No se pudieron cargar los campos del complejo.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Calendario semanal</Text>
      <Text style={styles.subtitle}>Selecciona un campo y gestiona su disponibilidad, tarifas y activación por franja.</Text>

      <ComboSelect
        styles={styles}
        label="Campo deportivo"
        value={courtId || ''}
        options={courts.map((court) => ({
          label: `${court.name} - ${court.sport}`,
          value: String(court.id),
        }))}
        onChange={onSelectCourt}
      />

      {!courts.length && <Text style={styles.status}>Este complejo todavía no tiene campos registrados.</Text>}
      {!!courtId && <WeeklyScheduleCalendarStable styles={styles} courtId={courtId} />}
      {!courtId && !!courts.length && <Text style={styles.status}>Selecciona el campo que deseas administrar.</Text>}
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
