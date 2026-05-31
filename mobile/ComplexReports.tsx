import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function money(value: number) {
  return `S/ ${Math.round(value || 0)}`;
}

export default function ComplexReports({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReports();
  }, [selectedComplex?.id]);

  async function loadReports() {
    if (!selectedComplex?.id) return;

    setMessage('Cargando reportes...');
    try {
      const [courtsRes, reservationsRes, paymentsRes, ratesRes] = await Promise.all([
        fetch(`${API_URL}/courts?complex_id=${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/reservations/${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/payments/${selectedComplex.id}`),
        fetch(`${API_URL}/complex-admin/court-rates/${selectedComplex.id}`),
      ]);

      setCourts(await courtsRes.json());
      setReservations(await reservationsRes.json());
      setPayments(await paymentsRes.json());
      setRates(await ratesRes.json());
      setMessage('');
    } catch {
      setMessage('No se pudieron cargar los reportes del complejo.');
    }
  }

  const confirmedReservations = reservations.filter((item) => item.status === 'confirmed').length;
  const pendingReservations = reservations.filter((item) => item.status !== 'confirmed').length;
  const paidAmount = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const potentialAmount = rates.reduce((sum, item) => sum + Number(item.price_per_hour || 0), 0);
  const configuredSlots = rates.length;
  const courtsWithRates = new Set(rates.map((item) => item.court_id)).size;

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
          { label: 'Reservas', value: reservations.length, description: 'Total del complejo' },
          { label: 'Confirmadas', value: confirmedReservations, description: 'Reservas confirmadas' },
          { label: 'Pendientes', value: pendingReservations, description: 'Por confirmar/revisar' },
          { label: 'Pagos recibidos', value: money(paidAmount), description: 'Monto registrado' },
          { label: 'Ingreso potencial', value: money(potentialAmount), description: 'Tarifas configuradas' },
          { label: 'Franjas tarifadas', value: configuredSlots, description: 'Disponibilidad con precio' },
          { label: 'Campos tarifados', value: courtsWithRates, description: 'Campos con tarifa' },
        ]}
      />

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

      <Text style={styles.title}>Disponibilidad con tarifa</Text>
      <ScrollView style={{ maxHeight: 260 }}>
        {rates.map((item) => {
          const court = courts.find((courtItem) => Number(courtItem.id) === Number(item.court_id));
          return (
            <View key={`rate-${item.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{court?.name || 'Campo'} - S/ {item.price_per_hour}</Text>
              <Text style={styles.moduleText}>Día: {item.day_of_week}</Text>
              <Text style={styles.moduleText}>{item.start_time} - {item.end_time}</Text>
              <Text style={styles.moduleText}>{item.description || ''}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
