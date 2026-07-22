import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexLocationCard from './ComplexLocationCard';
import ComplexMedia from './ComplexMedia';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const paymentMethodOptions = [
  { label: 'Yape', value: 'yape' },
  { label: 'Transferencia bancaria', value: 'transferencia' },
];

async function responseError(response: Response) {
  try { const data = await response.json(); return data.detail || data.message || `Error HTTP ${response.status}`; }
  catch { return `Error HTTP ${response.status}`; }
}

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
  const selectedComplex = complexes.find((item) => String(item.id) === selectedComplexId);
  const selectedCourt = courts.find((item) => String(item.id) === selectedCourtId);
  const selectedSchedule = schedules.find((item) => String(item.id) === selectedScheduleId);

  useEffect(() => { initialize(); }, [selectedMatch?.id]);

  async function initialize() {
    const complexId = selectedMatch?.sports_complex_id ? String(selectedMatch.sports_complex_id) : '';
    const courtId = selectedMatch?.court_id ? String(selectedMatch.court_id) : '';
    const scheduleId = selectedMatch?.schedule_id ? String(selectedMatch.schedule_id) : '';
    setSelectedComplexId(complexId); setSelectedCourtId(courtId); setSelectedScheduleId(scheduleId);
    setPaidToComplex(String(selectedMatch?.paid_to_complex || 0));
    setComplexPaymentMethod(selectedMatch?.complex_payment_method || 'yape');
    setComplexOperationCode(selectedMatch?.complex_payment_operation_code || '');
    await loadComplexes();
    if (complexId) await loadCourts(complexId, courtId);
    if (courtId) await loadSchedules(courtId, scheduleId);
  }

  async function loadComplexes() {
    try {
      const response = await fetch(`${API_URL}/sports-complexes`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json(); setComplexes(Array.isArray(data) ? data : []);
    } catch (error: any) { setMessage(error.message || 'No se pudieron cargar los complejos.'); }
  }

  async function loadCourts(complexId: string, preserveCourtId = '') {
    if (!preserveCourtId) { setSelectedCourtId(''); setSelectedScheduleId(''); setSchedules([]); }
    try {
      const response = await fetch(`${API_URL}/courts/?complex_id=${complexId}`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json(); setCourts(Array.isArray(data) ? data : []);
      if (preserveCourtId) setSelectedCourtId(preserveCourtId);
    } catch (error: any) { setCourts([]); setMessage(error.message || 'No se pudieron cargar los campos.'); }
  }

  async function loadSchedules(courtId: string, preserveScheduleId = '') {
    if (!preserveScheduleId) setSelectedScheduleId('');
    if (!selectedMatch?.match_date) { setSchedules([]); setMessage('La convocatoria debe tener una fecha específica antes de seleccionar una franja.'); return; }
    try {
      const date = selectedMatch.match_date;
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}&date_from=${date}&date_to=${date}`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const available = Array.isArray(data) ? data.filter((slot: any) => slot.calendar_date === date && slot.status === 'active' && !slot.is_reserved) : [];
      setSchedules(available);
      if (preserveScheduleId && available.some((slot: any) => String(slot.id) === preserveScheduleId)) setSelectedScheduleId(preserveScheduleId);
      else if (preserveScheduleId) setSelectedScheduleId('');
    } catch (error: any) { setSchedules([]); setMessage(error.message || 'No se pudieron cargar las franjas de la fecha indicada.'); }
  }

  async function saveAssociation() {
    if (!selectedMatch?.match_date) { setMessage('La convocatoria debe tener una fecha específica.'); return; }
    if (!selectedComplexId || !selectedCourtId || !selectedScheduleId) { setMessage('Selecciona complejo, campo y franja antes de guardar la asociación.'); return; }
    if (!selectedCourt || String(selectedCourt.complex_id) !== selectedComplexId) { setMessage('El campo seleccionado no pertenece al complejo indicado.'); return; }
    if (!selectedSchedule || selectedSchedule.calendar_date !== selectedMatch.match_date || String(selectedSchedule.court_id) !== selectedCourtId || selectedSchedule.is_reserved) { setMessage('La franja seleccionada no corresponde a la fecha de la convocatoria o ya no está disponible.'); return; }
    try {
      const response = await fetch(`${API_URL}/matches/${selectedMatch.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: selectedMatch.reservation_id || null, captain_user_id: Number(userId), title: selectedMatch.title,
          sport: selectedMatch.sport || 'futbol', max_players: Number(selectedMatch.max_players), tentative_location: selectedMatch.tentative_location,
          match_date: selectedMatch.match_date, match_time: selectedMatch.match_time, payment_deadline: selectedMatch.payment_deadline,
          player_fee: Number(selectedMatch.player_fee || 0), invitation_code: selectedMatch.invitation_code,
          sports_complex_id: Number(selectedComplexId), court_id: Number(selectedCourtId), schedule_id: Number(selectedScheduleId),
          paid_to_complex: Number(paidToComplex || 0), complex_payment_method: complexPaymentMethod,
          complex_payment_operation_code: complexOperationCode || null,
          complex_payment_receipt_url: selectedMatch.complex_payment_receipt_url || null,
          complex_payment_validation_status: 'pending_validation',
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json(); setMessage('Convocatoria asociada a una fecha y franja específicas. El pago queda pendiente de validación.');
      if (onSaved) await onSaved(data);
    } catch (error: any) { setMessage(error.message || 'No se pudo guardar la asociación oficial.'); }
  }

  if (!selectedMatch) return null;
  return <View>
    <Text style={styles.title}>Asociación oficial</Text>
    <Text style={styles.subtitle}>Fecha de la convocatoria: {selectedMatch.match_date || 'sin fecha'}. Solo se muestran franjas disponibles para ese día exacto.</Text>
    <ComboSelect styles={styles} label="Complejo deportivo" value={selectedComplexId} options={complexes.map((complex) => ({ label: `${complex.name} (${complex.address || 'sin dirección'})`, value: String(complex.id) }))} onChange={(value) => { setSelectedComplexId(value); loadCourts(value); }} />
    {!!selectedComplex && <><ComplexMedia styles={styles} complex={selectedComplex} compact /><ComplexLocationCard styles={styles} complex={selectedComplex} title={`Ubicación de ${selectedComplex.name}`} /></>}
    <ComboSelect styles={styles} label="Campo" value={selectedCourtId} options={courts.map((court) => ({ label: `${court.name} - ${court.sport}`, value: String(court.id) }))} onChange={(value) => { setSelectedCourtId(value); loadSchedules(value); }} />
    <ComboSelect styles={styles} label="Franja disponible para la fecha" value={selectedScheduleId} options={schedules.map((slot) => ({ label: `${slot.calendar_date} ${String(slot.start_time).slice(0, 5)} - ${String(slot.end_time).slice(0, 5)} | S/ ${slot.price_per_hour || 0}`, value: String(slot.id) }))} onChange={setSelectedScheduleId} />
    {!schedules.length && !!selectedCourtId && <Text style={styles.status}>No existen franjas activas y libres para {selectedMatch.match_date || 'la fecha indicada'}.</Text>}
    <TextInput style={styles.input} placeholder="Monto pagado al complejo" placeholderTextColor="#64748b" value={paidToComplex} onChangeText={setPaidToComplex} />
    <ComboSelect styles={styles} label="Método de pago" value={complexPaymentMethod} options={paymentMethodOptions} onChange={setComplexPaymentMethod} />
    <TextInput style={styles.input} placeholder="Número de operación" placeholderTextColor="#64748b" value={complexOperationCode} onChangeText={setComplexOperationCode} />
    <TouchableOpacity style={styles.primaryButton} onPress={saveAssociation}><Text style={styles.buttonText}>Guardar asociación oficial</Text></TouchableOpacity>
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
