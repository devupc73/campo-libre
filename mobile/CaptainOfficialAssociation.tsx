import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function dayName(day: number) {
  const days: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
  return days[day] || `Día ${day}`;
}

const paymentMethodOptions = [
  { label: 'Yape', value: 'yape' },
  { label: 'Transferencia bancaria', value: 'transferencia' },
];

export default function CaptainOfficialAssociation({ styles, userId, selectedMatch, onSaved }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [paidToComplex, setPaidToComplex] = useState('0');
  const [complexPaymentMethod, setComplexPaymentMethod] = useState('yape');
  const [complexOperationCode, setComplexOperationCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadComplexes();
    setSelectedComplexId(selectedMatch?.sports_complex_id ? String(selectedMatch.sports_complex_id) : '');
    setSelectedCourtId(selectedMatch?.court_id ? String(selectedMatch.court_id) : '');
    setSelectedScheduleId(selectedMatch?.schedule_id ? String(selectedMatch.schedule_id) : '');
    setPaidToComplex(String(selectedMatch?.paid_to_complex || 0));
    setComplexPaymentMethod(selectedMatch?.complex_payment_method || 'yape');
    setComplexOperationCode(selectedMatch?.complex_payment_operation_code || '');
  }, [selectedMatch?.id]);

  async function loadComplexes() {
    try {
      const response = await fetch(`${API_URL}/sports-complexes`);
      const data = await response.json();
      setComplexes(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los complejos.');
    }
  }

  async function loadCourts(complexId: string) {
    setSelectedCourtId('');
    setSelectedScheduleId('');
    setSchedules([]);
    try {
      const response = await fetch(`${API_URL}/courts?complex_id=${complexId}`);
      const data = await response.json();
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los campos.');
    }
  }

  async function loadSchedules(courtId: string) {
    setSelectedScheduleId('');
    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data.filter((slot: any) => slot.status === 'active') : []);
    } catch {
      setMessage('No se pudieron cargar las franjas.');
    }
  }

  async function saveAssociation() {
    if (!selectedMatch) return;
    try {
      const response = await fetch(`${API_URL}/matches/${selectedMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: selectedMatch.reservation_id || null,
          captain_user_id: Number(userId),
          title: selectedMatch.title,
          sport: selectedMatch.sport || 'futbol',
          max_players: Number(selectedMatch.max_players),
          tentative_location: selectedMatch.tentative_location,
          match_date: selectedMatch.match_date,
          match_time: selectedMatch.match_time,
          payment_deadline: selectedMatch.payment_deadline,
          player_fee: Number(selectedMatch.player_fee || 0),
          invitation_code: selectedMatch.invitation_code,
          sports_complex_id: selectedComplexId ? Number(selectedComplexId) : null,
          court_id: selectedCourtId ? Number(selectedCourtId) : null,
          schedule_id: selectedScheduleId ? Number(selectedScheduleId) : null,
          paid_to_complex: Number(paidToComplex || 0),
          complex_payment_method: complexPaymentMethod,
          complex_payment_operation_code: complexOperationCode,
          complex_payment_receipt_url: '',
          complex_payment_validation_status: 'pending_validation',
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage('Pago al complejo registrado. Pendiente validación del administrador del complejo.');
      if (onSaved) onSaved(data);
    } catch {
      setMessage('No se pudo guardar la asociación oficial y pago al complejo.');
    }
  }

  if (!selectedMatch) return null;

  return (
    <View>
      <Text style={styles.title}>Asociación oficial y pago al complejo</Text>
      <Text style={styles.subtitle}>Relaciona la convocatoria con complejo, campo y franja. La franja pasará a reservado cuando el complejo valide el pago.</Text>

      <ComboSelect styles={styles} label="Complejo deportivo" value={selectedComplexId} options={complexes.map((complex) => ({ label: `${complex.name} (${complex.address})`, value: String(complex.id) }))} onChange={(value) => { setSelectedComplexId(value); loadCourts(value); }} />
      <ComboSelect styles={styles} label="Campo" value={selectedCourtId} options={courts.map((court) => ({ label: `${court.name} - ${court.sport}`, value: String(court.id) }))} onChange={(value) => { setSelectedCourtId(value); loadSchedules(value); }} />
      <ComboSelect styles={styles} label="Franja horaria disponible" value={selectedScheduleId} options={schedules.map((slot) => ({ label: `${dayName(Number(slot.day_of_week))} ${slot.start_time} - ${slot.end_time} | S/ ${slot.price_per_hour || 0}`, value: String(slot.id) }))} onChange={setSelectedScheduleId} />

      <TextInput style={styles.input} placeholder="Monto pagado al complejo" placeholderTextColor="#64748b" value={paidToComplex} onChangeText={setPaidToComplex} />
      <ComboSelect styles={styles} label="Método de pago al complejo" value={complexPaymentMethod} options={paymentMethodOptions} onChange={setComplexPaymentMethod} />
      <TextInput style={styles.input} placeholder="Número de operación pago al complejo" placeholderTextColor="#64748b" value={complexOperationCode} onChangeText={setComplexOperationCode} />

      <TouchableOpacity style={styles.primaryButton} onPress={saveAssociation}>
        <Text style={styles.buttonText}>Registrar pago y solicitar validación</Text>
      </TouchableOpacity>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
