import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const paymentMethodOptions = [
  { label: 'Yape', value: 'yape' },
  { label: 'Transferencia bancaria', value: 'transferencia' },
];

export default function PlayerConvocations({ styles, userId }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
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
      setPaymentAmounts(defaultAmounts);
      setPaymentMethods(defaultMethods);
    } catch {
      setMessage('No se pudieron cargar las convocatorias.');
    }
  }

  async function joinMatch(matchId: number) {
    const amount = Number(paymentAmounts[String(matchId)] || 0);
    const method = paymentMethods[String(matchId)] || 'yape';

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
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(data.payment_status === 'paid' ? 'Inscripción y pago registrados.' : 'Inscripción registrada con pago pendiente.');
      loadMatches();
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
        {matches.map((match) => (
          <View key={match.id} style={styles.card}>
            <Text style={styles.cardTitle}>{match.title}</Text>
            <Text style={styles.moduleText}>Fecha: {match.match_date || '-'}</Text>
            <Text style={styles.moduleText}>Hora: {match.match_time || '-'}</Text>
            <Text style={styles.moduleText}>Lugar tentativo: {match.tentative_location || '-'}</Text>
            <Text style={styles.moduleText}>Cupos: {match.max_players}</Text>
            <Text style={styles.moduleText}>Aporte sugerido: S/ {match.player_fee || 0}</Text>
            <Text style={styles.moduleText}>Fecha límite de pago: {match.payment_deadline || '-'}</Text>

            <ComboSelect
              styles={styles}
              label="Método de pago realizado"
              value={paymentMethods[String(match.id)] || 'yape'}
              options={paymentMethodOptions}
              onChange={(value) => setPaymentMethods((current) => ({ ...current, [String(match.id)]: value }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Monto pagado"
              placeholderTextColor="#64748b"
              value={paymentAmounts[String(match.id)] || String(match.player_fee || 0)}
              onChangeText={(value) => setPaymentAmounts((current) => ({ ...current, [String(match.id)]: value }))}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={() => joinMatch(match.id)}>
              <Text style={styles.buttonText}>Inscribirme y registrar pago</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
