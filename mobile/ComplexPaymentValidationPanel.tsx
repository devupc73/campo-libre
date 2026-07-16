import React, { useEffect, useMemo, useState } from 'react';
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

export default function ComplexPaymentValidationPanel({ styles, selectedComplex }: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPayments();
  }, [selectedComplex?.id]);

  async function loadPayments() {
    if (!selectedComplex?.id) return;
    setLoading(true);
    setMessage('Cargando pagos del complejo...');
    try {
      const [paymentsResponse, courtsResponse] = await Promise.all([
        fetch(`${API_URL}/complex-admin/match-payments/${selectedComplex.id}`),
        fetch(`${API_URL}/courts/?complex_id=${selectedComplex.id}`),
      ]);
      if (!paymentsResponse.ok) throw new Error(await responseError(paymentsResponse));
      if (!courtsResponse.ok) throw new Error(await responseError(courtsResponse));
      const paymentData = await paymentsResponse.json();
      const courtData = await courtsResponse.json();
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setCourts(Array.isArray(courtData) ? courtData : []);
      setMessage('');
    } catch (error: any) {
      setPayments([]);
      setMessage(error.message || 'No se pudieron cargar los pagos del complejo.');
    } finally {
      setLoading(false);
    }
  }

  async function validatePayment(matchId: number, status: string) {
    setMessage('Actualizando validación...');
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
      if (status === 'validated') setMessage('Pago validado y franja reservada correctamente.');
      if (status === 'observed') setMessage('Pago observado. La franja queda disponible hasta su regularización.');
      if (status === 'rejected') setMessage('Pago rechazado. La franja volvió a estar disponible.');
      await loadPayments();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo actualizar la validación del pago.');
    }
  }

  const pending = useMemo(() => payments.filter((item) => (item.complex_payment_validation_status || 'pending_validation') === 'pending_validation'), [payments]);
  const validated = useMemo(() => payments.filter((item) => item.complex_payment_validation_status === 'validated'), [payments]);
  const observed = useMemo(() => payments.filter((item) => item.complex_payment_validation_status === 'observed'), [payments]);
  const pendingAmount = pending.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);

  return (
    <View>
      <Text style={styles.title}>Pagos del gestor hacia la cancha</Text>
      <Text style={styles.subtitle}>Revisa cada operación, valida el pago y reserva la franja asociada.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadPayments} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Actualizar pagos'}</Text>
      </TouchableOpacity>

      <DashboardCards
        styles={styles}
        items={[
          { label: 'Pendientes', value: pending.length, description: 'Requieren revisión' },
          { label: 'Monto pendiente', value: money(pendingAmount), description: 'Por validar' },
          { label: 'Validados', value: validated.length, description: 'Franjas reservadas' },
          { label: 'Observados', value: observed.length, description: 'Requieren corrección' },
        ]}
      />

      {!payments.length && !loading && <Text style={styles.status}>No hay pagos registrados para este complejo.</Text>}

      <ScrollView style={{ maxHeight: 650 }}>
        {payments.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          const status = item.complex_payment_validation_status || 'pending_validation';
          return (
            <View key={item.id} style={styles.moduleButton}>
              <Text style={styles.cardTitle}>{item.title || `Convocatoria #${item.id}`}</Text>
              <Text style={styles.moduleText}>Campo: {court?.name || item.court_id || '-'}</Text>
              <Text style={styles.moduleText}>Fecha: {item.match_date || '-'}</Text>
              <Text style={styles.moduleText}>Hora: {item.match_time || '-'}</Text>
              <Text style={styles.moduleText}>Monto pagado: {money(Number(item.paid_to_complex || 0))}</Text>
              <Text style={styles.moduleText}>Método: {item.complex_payment_method || '-'}</Text>
              <Text style={styles.moduleText}>Número de operación: {item.complex_payment_operation_code || '-'}</Text>
              <Text style={styles.moduleText}>Estado: {status}</Text>

              {status !== 'validated' && (
                <TouchableOpacity style={styles.primaryButton} onPress={() => validatePayment(item.id, 'validated')}>
                  <Text style={styles.buttonText}>Validar pago y reservar franja</Text>
                </TouchableOpacity>
              )}
              {status !== 'observed' && (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => validatePayment(item.id, 'observed')}>
                  <Text style={styles.buttonText}>Observar pago</Text>
                </TouchableOpacity>
              )}
              {status !== 'rejected' && (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => validatePayment(item.id, 'rejected')}>
                  <Text style={styles.buttonText}>Rechazar pago</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
