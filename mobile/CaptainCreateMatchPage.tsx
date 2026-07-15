import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function dayName(day: number) {
  const days: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
  return days[day] || `Día ${day}`;
}

export default function CaptainCreateMatchPage({ styles, title, setTitle, matchDate, setMatchDate, matchTime, setMatchTime, location, setLocation, maxPlayers, setMaxPlayers, fee, setFee, paymentDeadline, setPaymentDeadline, selectedComplexId, setSelectedComplexId, selectedCourtId, setSelectedCourtId, selectedScheduleId, setSelectedScheduleId, onCreate }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadComplexes();
  }, []);

  async function loadComplexes() {
    try {
      const response = await fetch(`${API_URL}/sports-complexes`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setComplexes(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los complejos deportivos.');
    }
  }

  async function loadCourts(complexId: string) {
    setSelectedCourtId('');
    setSelectedScheduleId('');
    setSchedules([]);
    try {
      const response = await fetch(`${API_URL}/courts/?complex_id=${complexId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setCourts([]);
      setMessage('No se pudieron cargar los campos del complejo.');
    }
  }

  async function loadSchedules(courtId: string) {
    setSelectedScheduleId('');
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data.filter((slot: any) => slot.status === 'active') : []);
    } catch {
      setSchedules([]);
      setMessage('No se pudieron cargar las franjas del campo.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Nueva convocatoria</Text>
      <Text style={styles.subtitle}>Selecciona el complejo, campo y franja que quedarán asociados a la convocatoria.</Text>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
      <ComboSelect
        styles={styles}
        label="Complejo deportivo"
        value={selectedComplexId}
        options={complexes.map((complex) => ({ label: `${complex.name} (${complex.address || 'sin dirección'})`, value: String(complex.id) }))}
        onChange={(value) => {
          setSelectedComplexId(value);
          loadCourts(value);
        }}
      />
      <ComboSelect
        styles={styles}
        label="Campo deportivo"
        value={selectedCourtId}
        options={courts.map((court) => ({ label: `${court.name} - ${court.sport}`, value: String(court.id) }))}
        onChange={(value) => {
          setSelectedCourtId(value);
          loadSchedules(value);
        }}
      />
      <ComboSelect
        styles={styles}
        label="Franja horaria"
        value={selectedScheduleId}
        options={schedules.map((slot) => ({
          label: `${dayName(Number(slot.day_of_week))} ${slot.start_time} - ${slot.end_time} | S/ ${slot.price_per_hour || 0}`,
          value: String(slot.id),
        }))}
        onChange={(value) => {
          setSelectedScheduleId(value);
          const slot = schedules.find((item) => String(item.id) === value);
          if (slot) setMatchTime(String(slot.start_time || ''));
        }}
      />
      <TextInput style={styles.input} placeholder="Fecha YYYY-MM-DD" placeholderTextColor="#64748b" value={matchDate} onChangeText={setMatchDate} />
      <TextInput style={styles.input} placeholder="Hora HH:MM:SS" placeholderTextColor="#64748b" value={matchTime} onChangeText={setMatchTime} />
      <TextInput style={styles.input} placeholder="Referencia adicional del lugar" placeholderTextColor="#64748b" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Cantidad jugadores" placeholderTextColor="#64748b" value={maxPlayers} onChangeText={setMaxPlayers} />
      <TextInput style={styles.input} placeholder="Pago por jugador" placeholderTextColor="#64748b" value={fee} onChangeText={setFee} />
      <TextInput style={styles.input} placeholder="Fecha límite pago" placeholderTextColor="#64748b" value={paymentDeadline} onChangeText={setPaymentDeadline} />
      <TouchableOpacity style={styles.primaryButton} onPress={onCreate}>
        <Text style={styles.buttonText}>Crear convocatoria</Text>
      </TouchableOpacity>
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
