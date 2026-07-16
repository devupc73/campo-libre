import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexLocationCard from './ComplexLocationCard';
import { ComplexMediaDisplay } from './ComplexMedia';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const dayNames: any = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
const paymentMethodOptions = [{ label: 'Yape', value: 'yape' }, { label: 'Transferencia bancaria', value: 'transferencia' }];
async function responseError(response: Response) { try { const data = await response.json(); return data.detail || data.message || `Error HTTP ${response.status}`; } catch { return `Error HTTP ${response.status}`; } }

export default function CaptainOfficialAssociation({ styles, userId, selectedMatch, onSaved }: any) {
  const [complexes, setComplexes] = useState<any[]>([]); const [courts, setCourts] = useState<any[]>([]); const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedComplexId, setSelectedComplexId] = useState(''); const [selectedCourtId, setSelectedCourtId] = useState(''); const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [paidToComplex, setPaidToComplex] = useState('0'); const [complexPaymentMethod, setComplexPaymentMethod] = useState('yape'); const [complexOperationCode, setComplexOperationCode] = useState(''); const [message, setMessage] = useState('');
  const selectedComplex = complexes.find((item) => String(item.id) === selectedComplexId);
  const associationConfirmed = !!selectedMatch?.sports_complex_id && String(selectedMatch.sports_complex_id) === selectedComplexId;

  useEffect(() => { initialize(); }, [selectedMatch?.id]);
  async function initialize() { const complexId = selectedMatch?.sports_complex_id ? String(selectedMatch.sports_complex_id) : ''; const courtId = selectedMatch?.court_id ? String(selectedMatch.court_id) : ''; const scheduleId = selectedMatch?.schedule_id ? String(selectedMatch.schedule_id) : ''; setSelectedComplexId(complexId); setSelectedCourtId(courtId); setSelectedScheduleId(scheduleId); setPaidToComplex(String(selectedMatch?.paid_to_complex || 0)); setComplexPaymentMethod(selectedMatch?.complex_payment_method || 'yape'); setComplexOperationCode(selectedMatch?.complex_payment_operation_code || ''); await loadComplexes(); if (complexId) await loadCourts(complexId, courtId); if (courtId) await loadSchedules(courtId, scheduleId); }
  async function loadComplexes() { try { const r = await fetch(`${API_URL}/sports-complexes`); if (!r.ok) throw new Error(await responseError(r)); setComplexes(await r.json()); } catch (e: any) { setMessage(e.message || 'No se pudieron cargar los complejos.'); } }
  async function loadCourts(complexId: string, preserve = '') { if (!preserve) { setSelectedCourtId(''); setSelectedScheduleId(''); } const r = await fetch(`${API_URL}/courts/?complex_id=${complexId}`); const data = r.ok ? await r.json() : []; setCourts(data); if (preserve) setSelectedCourtId(preserve); }
  async function loadSchedules(courtId: string, preserve = '') { if (!preserve) setSelectedScheduleId(''); const r = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`); const data = r.ok ? await r.json() : []; const active = data.filter((slot: any) => slot.status === 'active' || String(slot.id) === preserve); setSchedules(active); if (preserve) setSelectedScheduleId(preserve); }
  async function saveAssociation() { if (!selectedComplexId || !selectedCourtId || !selectedScheduleId) return setMessage('Selecciona complejo, campo y franja.'); try { const response = await fetch(`${API_URL}/matches/${selectedMatch.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selectedMatch, captain_user_id: Number(userId), sports_complex_id: Number(selectedComplexId), court_id: Number(selectedCourtId), schedule_id: Number(selectedScheduleId), paid_to_complex: Number(paidToComplex || 0), complex_payment_method: complexPaymentMethod, complex_payment_operation_code: complexOperationCode || null, complex_payment_validation_status: 'pending_validation' }) }); if (!response.ok) throw new Error(await responseError(response)); const data = await response.json(); setMessage('Convocatoria asociada correctamente.'); if (onSaved) await onSaved(data); } catch (e: any) { setMessage(e.message || 'No se pudo guardar la asociación.'); } }

  return <View><Text style={styles.title}>Asociación oficial</Text><Text style={styles.subtitle}>Asocia una convocatoria con un complejo, campo y franja disponible.</Text>
    {associationConfirmed && selectedComplex && <View style={styles.moduleButton}><Text style={styles.cardTitle}>Complejo confirmado</Text><ComplexMediaDisplay styles={styles} complex={selectedComplex} /><Text style={styles.moduleText}>{selectedComplex.name} · {selectedComplex.address}</Text></View>}
    <ComboSelect styles={styles} label="Complejo deportivo" value={selectedComplexId} options={complexes.map((c) => ({ label: `${c.name} (${c.address || 'sin dirección'})`, value: String(c.id) }))} onChange={(value) => { setSelectedComplexId(value); loadCourts(value); }} />
    {selectedComplex && <><ComplexMediaDisplay styles={styles} complex={selectedComplex} compact /><ComplexLocationCard styles={styles} complex={selectedComplex} title={`Ubicación de ${selectedComplex.name}`} /></>}
    <ComboSelect styles={styles} label="Campo" value={selectedCourtId} options={courts.map((c) => ({ label: `${c.name} - ${c.sport}`, value: String(c.id) }))} onChange={(value) => { setSelectedCourtId(value); loadSchedules(value); }} />
    <ComboSelect styles={styles} label="Franja horaria disponible" value={selectedScheduleId} options={schedules.map((s) => ({ label: `${dayNames[Number(s.day_of_week)] || s.day_of_week} ${s.start_time} - ${s.end_time} | S/ ${s.price_per_hour || 0}`, value: String(s.id) }))} onChange={setSelectedScheduleId} />
    <TextInput style={styles.input} placeholder="Monto pagado al complejo" placeholderTextColor="#64748b" value={paidToComplex} onChangeText={setPaidToComplex} /><ComboSelect styles={styles} label="Método de pago" value={complexPaymentMethod} options={paymentMethodOptions} onChange={setComplexPaymentMethod} /><TextInput style={styles.input} placeholder="Número de operación" placeholderTextColor="#64748b" value={complexOperationCode} onChangeText={setComplexOperationCode} />
    <TouchableOpacity style={styles.primaryButton} onPress={saveAssociation}><Text style={styles.buttonText}>Guardar asociación oficial</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
