import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';
import PaymentProofView from './PaymentProofView';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function money(value: number) {
  return `S/ ${Math.round(value || 0)}`;
}

export default function ComplexCaptainPaymentsPage({ styles, selectedComplex }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadItems();
  }, [selectedComplex?.id]);

  async function loadItems() {
    if (!selectedComplex?.id) return;
    try {
      const response = await fetch(`${API_URL}/complex-admin/match-payments/${selectedComplex.id}`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los pagos de capitanes.');
    }
  }

  async function validatePayment(matchId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/complex-admin/match-payments/${matchId}/validation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complex_payment_validation_status: status }),
      });

      if (!response.ok) throw new Error();

      if (status === 'validated') setMessage('Pago validado. La franja horaria quedó separada y no disponible para el capitán.');
      if (status === 'observed') setMessage('Pago observado. La franja queda pendiente de validación.');
      if (status === 'rejected') setMessage('Pago rechazado. La franja vuelve a quedar disponible.');
      await loadItems();
    } catch {
      setMessage('No se pudo actualizar la validación del pago.');
    }
  }

  const pending = items.filter((item) => item.complex_payment_validation_status === 'pending_validation').length;
  const validated = items.filter((item) => item.complex_payment_validation_status === 'validated').length;
  const total = items.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0);

  return (
    <View>
      <Text style={styles.title}>Pagos de capitanes al complejo</Text>
      <Text style={styles.subtitle}>Valida el pago recibido. Al validar, la franja asociada queda reservada y no disponible.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadItems}>
        <Text style={styles.buttonText}>Actualizar pagos</Text>
      </TouchableOpacity>

      <DashboardCards styles={styles} items={[
        { label: 'Pagos registrados', value: items.length, description: 'Capitanes/gestores' },
        { label: 'Pendientes', value: pending, description: 'Por validar' },
        { label: 'Validados', value: validated, description: 'Franjas separadas' },
        { label: 'Monto declarado', value: money(total), description: 'Pagos reportados' },
      ]} />

      <ScrollView style={{ maxHeight: 520 }}>
        {items.map((item) => (
          <View key={`complex-payment-${item.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title || 'Convocatoria'} - {money(Number(item.paid_to_complex || 0))}</Text>
            <Text style={styles.moduleText}>Campo ID: {item.court_id || '-'}</Text>
            <Text style={styles.moduleText}>Franja ID: {item.schedule_id || '-'}</Text>
            <Text style={styles.moduleText}>Método: {item.complex_payment_method || '-'}</Text>
            <Text style={styles.moduleText}>Operación: {item.complex_payment_operation_code || '-'}</Text>
            <Text style={styles.moduleText}>Estado: {item.complex_payment_validation_status || '-'}</Text>
            <PaymentProofView styles={styles} proof={item.complex_payment_receipt_url} />

            <TouchableOpacity style={styles.primaryButton} onPress={() => validatePayment(item.id, 'validated')}>
              <Text style={styles.buttonText}>Validar y separar franja</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => validatePayment(item.id, 'observed')}>
              <Text style={styles.buttonText}>Observar pago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => validatePayment(item.id, 'rejected')}>
              <Text style={styles.buttonText}>Rechazar pago</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
