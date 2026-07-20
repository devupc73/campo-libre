import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][], onError: (message: string) => void) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    onError('La exportación está disponible desde la versión web.');
    return;
  }
  const csv = `\ufeff${[headers, ...rows].map((row) => row.map(csvValue).join(';')).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function CaptainCollectionReports({ styles, userId, matches }: any) {
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedMatchId && matches?.length) setSelectedMatchId(String(matches[0].id));
  }, [matches]);

  useEffect(() => {
    if (selectedMatchId) loadParticipants();
  }, [selectedMatchId]);

  async function loadParticipants() {
    setLoading(true);
    setMessage('Cargando pagos de la convocatoria...');
    try {
      const response = await fetch(`${API_URL}/match-participants?match_id=${selectedMatchId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setParticipants(Array.isArray(data) ? data : []);
      setMessage('');
    } catch {
      setParticipants([]);
      setMessage('No se pudieron cargar los pagos de la convocatoria.');
    } finally {
      setLoading(false);
    }
  }

  const selectedMatch = useMemo(
    () => (matches || []).find((item: any) => String(item.id) === String(selectedMatchId)),
    [matches, selectedMatchId],
  );

  const payments = useMemo(
    () => participants.filter((item) => item.payment_status === 'paid' || Number(item.paid_amount || 0) > 0),
    [participants],
  );

  const validatedPayments = payments.filter((item) => item.payment_validation_status === 'validated');
  const pendingPayments = payments.filter((item) => item.payment_validation_status === 'pending_validation');
  const declaredAmount = payments.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
  const validatedAmount = validatedPayments.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);

  const totals = useMemo(() => {
    const collected = (matches || []).reduce((sum: number, item: any) => sum + Number(item.validated_collected_amount ?? item.collected_amount ?? 0), 0);
    const paid = (matches || []).reduce((sum: number, item: any) => sum + Number(item.paid_to_complex || 0), 0);
    return { collected, paid, balance: collected - paid };
  }, [matches]);

  function exportDetail() {
    if (!selectedMatch || !payments.length) {
      setMessage('No hay pagos para exportar en esta convocatoria.');
      return;
    }
    const rows = payments.map((item) => [
      selectedMatch.title,
      selectedMatch.match_date || '',
      selectedMatch.match_time || '',
      item.user_id,
      item.payment_method || '',
      item.payment_operation_code || '',
      Number(item.paid_amount || 0).toFixed(2),
      item.payment_validation_status || '',
      item.paid_players_count || 1,
    ]);
    downloadCsv(
      `recaudacion-${String(selectedMatch.title || selectedMatch.id).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`,
      ['Convocatoria', 'Fecha', 'Hora', 'Jugador ID', 'Método', 'Operación', 'Monto pagado', 'Estado de validación', 'Jugadores cubiertos'],
      rows,
      setMessage,
    );
    setMessage('Detalle exportado correctamente.');
  }

  function exportConsolidated() {
    if (!(matches || []).length) {
      setMessage('No hay convocatorias para exportar.');
      return;
    }
    const rows = (matches || []).map((item: any) => {
      const collected = Number(item.validated_collected_amount ?? item.collected_amount ?? 0);
      const paid = Number(item.paid_to_complex || 0);
      return [
        item.title || `Convocatoria #${item.id}`,
        item.match_date || '',
        item.match_time || '',
        collected.toFixed(2),
        paid.toFixed(2),
        (collected - paid).toFixed(2),
        item.validated_paid_players || 0,
        item.pending_validation_players || 0,
        item.complex_payment_validation_status || '',
      ];
    });
    downloadCsv(
      `consolidado-convocatorias-gestor-${userId}.csv`,
      ['Convocatoria', 'Fecha', 'Hora', 'Monto recaudado validado', 'Monto pagado al complejo', 'Saldo', 'Pagos validados', 'Pagos pendientes', 'Estado del pago al complejo'],
      rows,
      setMessage,
    );
    setMessage('Consolidado exportado correctamente.');
  }

  return (
    <View>
      <Text style={styles.title}>Reporte de recaudación</Text>
      <Text style={styles.subtitle}>Consulta el avance por convocatoria y el consolidado financiero de todas tus convocatorias.</Text>

      <Text style={styles.title}>Detalle por convocatoria</Text>
      <ComboSelect
        styles={styles}
        label="Convocatoria"
        value={selectedMatchId}
        options={(matches || []).map((item: any) => ({ label: `${item.title} · ${item.match_date || 'sin fecha'}`, value: String(item.id) }))}
        onChange={setSelectedMatchId}
      />

      {selectedMatch && <DashboardCards styles={styles} items={[
        { label: 'Pagos registrados', value: payments.length, description: 'Aportes declarados' },
        { label: 'Monto declarado', value: money(declaredAmount), description: 'Incluye pendientes' },
        { label: 'Monto validado', value: money(validatedAmount), description: 'Recaudación confirmada' },
        { label: 'Pendientes', value: pendingPayments.length, description: 'Por validar' },
      ]} />}

      <TouchableOpacity style={styles.primaryButton} onPress={exportDetail}>
        <Text style={styles.buttonText}>Exportar detalle CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={loadParticipants} disabled={!selectedMatchId || loading}>
        <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Actualizar detalle'}</Text>
      </TouchableOpacity>

      {!payments.length && !loading && <Text style={styles.status}>No existen pagos registrados para la convocatoria seleccionada.</Text>}
      <ScrollView style={{ maxHeight: 420, marginTop: 16 }}>
        {payments.map((item) => (
          <View key={item.id} style={styles.moduleButton}>
            <Text style={styles.cardTitle}>Jugador #{item.user_id}</Text>
            <Text style={styles.moduleText}>Monto pagado: {money(Number(item.paid_amount || 0))}</Text>
            <Text style={styles.moduleText}>Método: {item.payment_method || '-'}</Text>
            <Text style={styles.moduleText}>Operación: {item.payment_operation_code || '-'}</Text>
            <Text style={styles.moduleText}>Jugadores cubiertos: {item.paid_players_count || 1}</Text>
            <Text style={styles.moduleText}>Estado: {item.payment_validation_status || '-'}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.title, { marginTop: 24 }]}>Consolidado de convocatorias</Text>
      <DashboardCards styles={styles} items={[
        { label: 'Convocatorias', value: (matches || []).length, description: 'Total gestionado' },
        { label: 'Recaudado', value: money(totals.collected), description: 'Pagos validados' },
        { label: 'Pagado a complejos', value: money(totals.paid), description: 'Transferencias registradas' },
        { label: 'Saldo', value: money(totals.balance), description: 'Fondo disponible' },
      ]} />

      <TouchableOpacity style={styles.primaryButton} onPress={exportConsolidated}>
        <Text style={styles.buttonText}>Exportar consolidado CSV</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 520, marginTop: 16 }}>
        {(matches || []).map((item: any) => {
          const collected = Number(item.validated_collected_amount ?? item.collected_amount ?? 0);
          const paid = Number(item.paid_to_complex || 0);
          const balance = collected - paid;
          return (
            <View key={`summary-${item.id}`} style={styles.moduleButton}>
              <Text style={styles.cardTitle}>{item.title || `Convocatoria #${item.id}`}</Text>
              <Text style={styles.moduleText}>Fecha y hora: {item.match_date || '-'} {item.match_time || ''}</Text>
              <Text style={styles.moduleText}>Monto recaudado: {money(collected)}</Text>
              <Text style={styles.moduleText}>Monto pagado al complejo: {money(paid)}</Text>
              <Text style={styles.moduleText}>Saldo: {money(balance)}</Text>
              <Text style={styles.moduleText}>Pagos validados: {item.validated_paid_players || 0}</Text>
              <Text style={styles.moduleText}>Pagos pendientes: {item.pending_validation_players || 0}</Text>
              <Text style={styles.moduleText}>Pago al complejo: {item.complex_payment_validation_status || 'sin registrar'}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
