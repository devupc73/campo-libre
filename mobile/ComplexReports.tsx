import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

async function responseError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

export default function ComplexReports({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [matchPayments, setMatchPayments] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReports();
  }, [selectedComplex?.id]);

  async function loadReports() {
    if (!selectedComplex?.id) return;

    setMessage('Cargando reportes...');
    try {
      const [courtsRes, reservationsRes, paymentsRes, matchPaymentsRes, ratesRes] = await Promise.all([
        fetch(`${API_URL}/courts/?complex_id=${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/reservations/${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/payments/${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/match-payments/${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/court-rates/${selectedComplex.id}`),
      ]);

      if (!courtsRes.ok) throw new Error(await responseError(courtsRes));
      if (!reservationsRes.ok) throw new Error(await responseError(reservationsRes));
      if (!paymentsRes.ok) throw new Error(await responseError(paymentsRes));
      if (!matchPaymentsRes.ok) throw new Error(await responseError(matchPaymentsRes));
      if (!ratesRes.ok) throw new Error(await responseError(ratesRes));

      const courtsData = await courtsRes.json();
      const reservationsData = await reservationsRes.json();
      const paymentsData = await paymentsRes.json();
      const matchPaymentsData = await matchPaymentsRes.json();
      const ratesData = await ratesRes.json();

      const scheduleResponses = await Promise.all(
        (Array.isArray(courtsData) ? courtsData : []).map((court) =>
          fetch(`${API_URL}/court-schedules?court_id=${court.id}`),
        ),
      );
      const invalidScheduleResponse = scheduleResponses.find((response) => !response.ok);
      if (invalidScheduleResponse) throw new Error(await responseError(invalidScheduleResponse));
      const scheduleGroups = await Promise.all(scheduleResponses.map((response) => response.json()));
      const schedulesData = scheduleGroups.flatMap((group) => (Array.isArray(group) ? group : []));

      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setMatchPayments(Array.isArray(matchPaymentsData) ? matchPaymentsData : []);
      setRates(Array.isArray(ratesData) ? ratesData : []);
      setSchedules(schedulesData);
      setMessage('');
    } catch (error: any) {
      setMessage(error.message || 'No se pudieron cargar los reportes del complejo.');
    }
  }

  async function validateMatchPayment(matchId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/complex-admin/match-payments/${matchId}/validation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complex_id: Number(selectedComplex.id),
          complex_payment_validation_status: status,
        }),
      });

      if (!response.ok) throw new Error(await responseError(response));

      if (status === 'validated') setMessage('Pago validado. La franja quedó marcada como reservada.');
      if (status === 'observed') setMessage('Pago observado.');
      if (status === 'rejected') setMessage('Pago rechazado.');

      await loadReports();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo actualizar la validación del pago al complejo.');
    }
  }

  const validatedMatches = matchPayments.filter((item) => item.complex_payment_validation_status === 'validated');
  const pendingMatches = matchPayments.filter((item) => (item.complex_payment_validation_status || 'pending_validation') === 'pending_validation');
  const observedMatches = matchPayments.filter((item) => item.complex_payment_validation_status === 'observed');
  const rejectedMatches = matchPayments.filter((item) => item.complex_payment_validation_status === 'rejected');

  const validatedAmount = validatedMatches.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);
  const pendingAmount = pendingMatches.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);
  const observedAmount = observedMatches.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);
  const registeredAmount = matchPayments.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);
  const legacyConfirmedReservations = reservations.filter((item) => item.status === 'confirmed').length;

  const activeSchedules = schedules.filter((item) => item.status === 'active');
  const reservedSchedules = activeSchedules.filter((item) => Boolean(item.is_reserved));
  const availableSchedules = activeSchedules.filter((item) => !item.is_reserved);
  const inactiveSchedules = schedules.filter((item) => item.status !== 'active');
  const potentialAmount = activeSchedules.reduce((sum, item) => sum + Number(item.price_per_hour || 0), 0);
  const availablePotentialAmount = availableSchedules.reduce((sum, item) => sum + Number(item.price_per_hour || 0), 0);
  const reservedPotentialAmount = reservedSchedules.reduce((sum, item) => sum + Number(item.price_per_hour || 0), 0);
  const courtsWithSchedules = new Set(schedules.map((item) => item.court_id)).size;

  return (
    <View>
      <Text style={styles.title}>Reportes del complejo</Text>
      <Text style={styles.subtitle}>Consulta reservas, disponibilidad y pagos de {selectedComplex?.name}.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadReports}>
        <Text style={styles.buttonText}>Actualizar reportes</Text>
      </TouchableOpacity>

      <DashboardCards
        styles={styles}
        items={[
          { label: 'Campos', value: courts.length, description: 'Campos registrados' },
          { label: 'Reservas confirmadas', value: validatedMatches.length, description: 'Pagos de gestores validados' },
          { label: 'Monto confirmado', value: money(validatedAmount), description: 'Ingreso validado' },
          { label: 'Por validar', value: pendingMatches.length, description: money(pendingAmount) },
          { label: 'Observados', value: observedMatches.length, description: money(observedAmount) },
          { label: 'Rechazados', value: rejectedMatches.length, description: 'Pagos rechazados' },
          { label: 'Monto registrado', value: money(registeredAmount), description: 'Todos los pagos de gestores' },
          { label: 'Reservas tradicionales', value: reservations.length, description: `${legacyConfirmedReservations} confirmadas` },
          { label: 'Ingreso potencial', value: money(potentialAmount), description: 'Todas las franjas activas' },
          { label: 'Potencial disponible', value: money(availablePotentialAmount), description: 'Franjas activas y libres' },
          { label: 'Valor reservado', value: money(reservedPotentialAmount), description: 'Franjas activas reservadas' },
          { label: 'Franjas activas', value: activeSchedules.length, description: `${availableSchedules.length} libres` },
          { label: 'Franjas reservadas', value: reservedSchedules.length, description: 'Con reserva confirmada o manual' },
          { label: 'Franjas inactivas', value: inactiveSchedules.length, description: 'No disponibles para reserva' },
          { label: 'Campos con horario', value: courtsWithSchedules, description: 'Campos con franjas configuradas' },
        ]}
      />

      <Text style={styles.title}>Pagos de gestores</Text>
      <ScrollView style={{ maxHeight: 360 }}>
        {matchPayments.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          return (
            <View key={`match-payment-${item.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.moduleText}>Campo: {court?.name || item.court_id || '-'}</Text>
              <Text style={styles.moduleText}>Monto pagado: {money(Number(item.paid_to_complex || 0))}</Text>
              <Text style={styles.moduleText}>Método: {item.complex_payment_method || '-'}</Text>
              <Text style={styles.moduleText}>Número de operación: {item.complex_payment_operation_code || '-'}</Text>
              <Text style={styles.moduleText}>Estado: {item.complex_payment_validation_status || 'pending_validation'}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => validateMatchPayment(item.id, 'validated')}>
                <Text style={styles.buttonText}>Aceptar pago y reservar franja</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => validateMatchPayment(item.id, 'observed')}>
                <Text style={styles.buttonText}>Observar pago</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => validateMatchPayment(item.id, 'rejected')}>
                <Text style={styles.buttonText}>Rechazar pago</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Text style={styles.title}>Reservas registradas</Text>
      <ScrollView style={{ maxHeight: 260 }}>
        {reservations.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          return (
            <View key={`reservation-${item.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{court?.name || 'Campo'} - Reserva #{item.id}</Text>
              <Text style={styles.moduleText}>Estado: {item.status || 'sin estado'}</Text>
              <Text style={styles.moduleText}>Total: {money(Number(item.total_price || 0))}</Text>
              <Text style={styles.moduleText}>Campo ID: {item.court_id}</Text>
            </View>
          );
        })}
      </ScrollView>

      <Text style={styles.title}>Pagos registrados</Text>
      <ScrollView style={{ maxHeight: 220 }}>
        {payments.map((item) => (
          <View key={`payment-${item.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>Pago #{item.id}</Text>
            <Text style={styles.moduleText}>Monto: {money(Number(item.amount || 0))}</Text>
            <Text style={styles.moduleText}>Estado: {item.status || 'sin estado'}</Text>
            <Text style={styles.moduleText}>Reserva: {item.reservation_id || '-'}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.title}>Franjas reales del calendario</Text>
      <ScrollView style={{ maxHeight: 320 }}>
        {schedules.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          return (
            <View key={`schedule-${item.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{court?.name || 'Campo'} - {money(Number(item.price_per_hour || 0))}</Text>
              <Text style={styles.moduleText}>Día: {item.day_of_week}</Text>
              <Text style={styles.moduleText}>{item.start_time} - {item.end_time}</Text>
              <Text style={styles.moduleText}>Estado: {item.status === 'active' ? 'Activa' : 'Inactiva'}</Text>
              <Text style={styles.moduleText}>Reserva: {item.is_reserved ? 'Reservada' : 'Libre'}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!!rates.length && (
        <Text style={styles.moduleText}>Se encontraron {rates.length} tarifas históricas. Los indicadores usan las franjas reales del calendario.</Text>
      )}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
