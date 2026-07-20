import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function csvValue(value: unknown) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

export default function ConfirmedReservationsReport({ styles, selectedComplex }: any) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfirmedReservations();
  }, [selectedComplex?.id]);

  async function loadConfirmedReservations() {
    if (!selectedComplex?.id) return;
    setLoading(true);
    setMessage('Cargando reservas confirmadas...');
    try {
      const [paymentsResponse, courtsResponse] = await Promise.all([
        fetch(`${API_URL}/complex-admin/match-payments/${selectedComplex.id}`),
        fetch(`${API_URL}/courts/?complex_id=${selectedComplex.id}`),
      ]);
      if (!paymentsResponse.ok || !courtsResponse.ok) throw new Error();
      const paymentsData = await paymentsResponse.json();
      const courtsData = await courtsResponse.json();
      setReservations((Array.isArray(paymentsData) ? paymentsData : []).filter((item) => item.complex_payment_validation_status === 'validated'));
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setMessage('');
    } catch {
      setReservations([]);
      setCourts([]);
      setMessage('No se pudieron cargar las reservas confirmadas.');
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = useMemo(
    () => reservations.reduce((sum, item) => sum + Number(item.paid_to_complex || 0), 0),
    [reservations],
  );

  function exportCsv() {
    if (!reservations.length) {
      setMessage('No hay reservas confirmadas para exportar.');
      return;
    }
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      setMessage('La exportación está disponible desde la versión web.');
      return;
    }

    const headers = ['Complejo', 'Convocatoria', 'Campo', 'Fecha', 'Hora', 'Método de pago', 'Número de operación', 'Monto pagado', 'Estado'];
    const rows = reservations.map((item) => {
      const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
      return [
        selectedComplex?.name || '',
        item.title || `Convocatoria #${item.id}`,
        court?.name || item.court_id || '',
        item.match_date || '',
        item.match_time || '',
        item.complex_payment_method || '',
        item.complex_payment_operation_code || '',
        Number(item.paid_to_complex || 0).toFixed(2),
        'Confirmada',
      ];
    });

    const csv = `\ufeff${[headers, ...rows].map((row) => row.map(csvValue).join(';')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservas-confirmadas-${String(selectedComplex?.name || selectedComplex?.id || 'complejo').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setMessage('Reporte exportado correctamente.');
  }

  return (
    <View>
      <Text style={styles.title}>Reservas confirmadas</Text>
      <Text style={styles.subtitle}>Listado de reservas cuyo pago al complejo ya fue validado.</Text>

      <DashboardCards styles={styles} items={[
        { label: 'Reservas confirmadas', value: reservations.length, description: 'Pagos validados' },
        { label: 'Monto recibido', value: money(totalPaid), description: 'Total confirmado' },
      ]} />

      <TouchableOpacity style={styles.primaryButton} onPress={exportCsv}>
        <Text style={styles.buttonText}>Exportar reporte CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={loadConfirmedReservations} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Actualizar lista'}</Text>
      </TouchableOpacity>

      {!reservations.length && !loading && <Text style={styles.status}>Todavía no existen reservas confirmadas para este complejo.</Text>}

      <ScrollView style={{ maxHeight: 650, marginTop: 16 }}>
        {reservations.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          return (
            <View key={item.id} style={styles.moduleButton}>
              <Text style={styles.cardTitle}>{item.title || `Convocatoria #${item.id}`}</Text>
              <Text style={styles.moduleText}>Campo: {court?.name || item.court_id || '-'}</Text>
              <Text style={styles.moduleText}>Fecha: {item.match_date || '-'}</Text>
              <Text style={styles.moduleText}>Hora: {item.match_time || '-'}</Text>
              <Text style={styles.moduleText}>Monto pagado: {money(Number(item.paid_to_complex || 0))}</Text>
              <Text style={styles.moduleText}>Método: {item.complex_payment_method || '-'}</Text>
              <Text style={styles.moduleText}>Operación: {item.complex_payment_operation_code || '-'}</Text>
              <Text style={styles.moduleText}>Estado: Confirmada</Text>
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
