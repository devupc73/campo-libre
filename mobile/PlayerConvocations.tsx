import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const paymentMethodOptions = [
  { label: 'Yape', value: 'yape' },
  { label: 'Transferencia bancaria', value: 'transferencia' },
];

export default function PlayerConvocations({ styles, userId }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [operationCodes, setOperationCodes] = useState<Record<string, string>>({});
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const response = await fetch(`${API_URL}/matches`);
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);

      const defaultAmounts: Record<string, string> = {};
      const defaultMethods: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((match) => {
          defaultAmounts[String(match.id)] = String(match.player_fee || 0);
          defaultMethods[String(match.id)] = 'yape';
        });
      }
      setPaymentAmounts((current) => ({ ...defaultAmounts, ...current }));
      setPaymentMethods((current) => ({ ...defaultMethods, ...current }));
    } catch {
      setMessage('No se pudieron cargar las convocatorias.');
    }
  }

  async function joinMatch(matchId: number) {
    const key = String(matchId);
    const amount = Number(paymentAmounts[key] || 0);
    const method = paymentMethods[key] || 'yape';
    const operationCode = operationCodes[key] || '';
    const receiptUrl = receiptUrls[key] || '';

    try {
      const response = await fetch(`${API_URL}/match-participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          user_id: Number(userId),
          position: '',
          skill_level: 3,
          payment_method: method,
          paid_amount: amount,
          payment_operation_code: operationCode,
          payment_receipt_url: receiptUrl,
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(data.payment_status === 'paid' ? 'Inscripción y pago registrados. Pendiente validación del capitán.' : 'Inscripción registrada con pago pendiente.');
      await loadMatches();
    } catch {
      setMessage('No se pudo registrar la inscripción.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Convocatorias disponibles</Text>
      <Text style={styles.subtitle}>Inscríbete y registra el pago realizado al capitán.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadMatches}>
        <Text style={styles.buttonText}>Actualizar convocatorias</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 620 }}>
        {matches.map((match) => {
          const key = String(match.id);
          return (
            <View key={match.id} style={styles.card}>
              <Text style={styles.cardTitle}>{match.title}</Text>
              <Text style={styles.moduleText}>Fecha: {match.match_date || '-'}</Text>
              <Text style={styles.moduleText}>Hora: {match.match_time || '-'}</Text>
              <Text style={styles.moduleText}>Lugar tentativo: {match.tentative_location || '-'}</Text>
              <Text style={styles.moduleText}>Fecha límite de pago: {match.payment_deadline || '-'}</Text>

              <DashboardCards
                styles={styles}
                items={[
                  { label: 'Inscritos', value: match.total_players || 0, description: 'Total apuntados' },
                  { label: 'Confirmados', value: `${match.confirmed_players || 0}/${match.max_players || 0}`, description: 'Titulares' },
                  { label: 'Reservas', value: match.reserve_players || 0, description: 'Lista de espera' },
                  { label: 'Disponible', value: match.available_slots || 0, description: 'Cupos titulares' },
                  { label: 'Recaudado', value: `S/ ${match.collected_amount || 0}`, description: 'Pagos registrados' },
                  { label: 'Por validar', value: match.pending_validation_players || 0, description: 'Pagos con constancia' },
                ]}
              />

              <Text style={styles.moduleText}>Aporte sugerido: S/ {match.player_fee || 0}</Text>

              <ComboSelect
                styles={styles}
                label="Método de pago realizado"
                value={paymentMethods[key] || 'yape'}
                options={paymentMethodOptions}
                onChange={(value) => setPaymentMethods((current) => ({ ...current, [key]: value }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Monto pagado"
                placeholderTextColor="#64748b"
                value={paymentAmounts[key] || String(match.player_fee || 0)}
                onChangeText={(value) => setPaymentAmounts((current) => ({ ...current, [key]: value }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Código de operación Yape / transferencia"
                placeholderTextColor="#64748b"
                value={operationCodes[key] || ''}
                onChangeText={(value) => setOperationCodes((current) => ({ ...current, [key]: value }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Link o referencia de imagen de constancia"
                placeholderTextColor="#64748b"
                value={receiptUrls[key] || ''}
                onChangeText={(value) => setReceiptUrls((current) => ({ ...current, [key]: value }))}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={() => joinMatch(match.id)}>
                <Text style={styles.buttonText}>Inscribirme y registrar pago</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
