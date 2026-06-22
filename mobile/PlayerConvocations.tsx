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
  const [invitationCode, setInvitationCode] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paidPlayersCounts, setPaidPlayersCounts] = useState<Record<string, string>>({});
  const [operationCodes, setOperationCodes] = useState<Record<string, string>>({});
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMyMatches();
  }, []);

  function hydrateDefaults(data: any[]) {
    const defaultAmounts: Record<string, string> = {};
    const defaultMethods: Record<string, string> = {};
    const defaultCounts: Record<string, string> = {};
    data.forEach((match) => {
      defaultAmounts[String(match.id)] = String(match.player_fee || 0);
      defaultMethods[String(match.id)] = 'yape';
      defaultCounts[String(match.id)] = '1';
    });
    setPaymentAmounts((current) => ({ ...defaultAmounts, ...current }));
    setPaymentMethods((current) => ({ ...defaultMethods, ...current }));
    setPaidPlayersCounts((current) => ({ ...defaultCounts, ...current }));
  }

  async function loadMyMatches() {
    try {
      const response = await fetch(`${API_URL}/matches?player_user_id=${userId}`);
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [];
      setMatches(rows);
      hydrateDefaults(rows);
    } catch {
      setMessage('No se pudieron cargar tus convocatorias inscritas.');
    }
  }

  async function searchByCode() {
    const code = invitationCode.trim().toUpperCase();
    if (!code) {
      setMessage('Ingresa el código privado de la convocatoria.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/matches?invitation_code=${encodeURIComponent(code)}`);
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [];

      if (!rows.length) {
        setMessage('No se encontró una convocatoria con ese código.');
        return;
      }

      const existingIds = new Set(matches.map((match) => String(match.id)));
      const merged = [...rows, ...matches.filter((match) => !existingIds.has(String(match.id)))];
      setMatches(merged);
      hydrateDefaults(merged);
      setMessage('Convocatoria encontrada. Ya puedes inscribirte.');
    } catch {
      setMessage('No se pudo buscar la convocatoria por código.');
    }
  }

  async function joinMatch(matchId: number) {
    const key = String(matchId);
    const amount = Number(paymentAmounts[key] || 0);
    const paidPlayersCount = Math.max(Number(paidPlayersCounts[key] || 1), 1);
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
          paid_players_count: paidPlayersCount,
          payment_operation_code: operationCode,
          payment_receipt_url: receiptUrl,
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(data.payment_status === 'paid' ? `Inscripción y pago por ${paidPlayersCount} jugador(es) registrados. Pendiente validación del capitán.` : 'Inscripción registrada con pago pendiente.');
      await loadMyMatches();
    } catch {
      setMessage('No se pudo registrar la inscripción.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Mis convocatorias</Text>
      <Text style={styles.subtitle}>Ingresa el código privado que te compartió el capitán. Luego de inscribirte podrás ver el avance aquí.</Text>

      <TextInput
        style={styles.input}
        placeholder="Código privado de convocatoria"
        placeholderTextColor="#64748b"
        value={invitationCode}
        onChangeText={(value) => setInvitationCode(value.toUpperCase())}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={searchByCode}>
        <Text style={styles.buttonText}>Buscar convocatoria por código</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadMyMatches}>
        <Text style={styles.buttonText}>Actualizar mis convocatorias</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 620 }}>
        {matches.map((match) => {
          const key = String(match.id);
          return (
            <View key={match.id} style={styles.card}>
              <Text style={styles.cardTitle}>{match.title}</Text>
              <Text style={styles.moduleText}>Código: {match.invitation_code || '-'}</Text>
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
                  { label: 'Validado', value: `S/ ${match.validated_collected_amount || match.collected_amount || 0}`, description: 'Fondo reconocido' },
                  { label: 'Declarado', value: `S/ ${match.declared_collected_amount || 0}`, description: 'Pagos reportados' },
                ]}
              />

              <Text style={styles.moduleText}>Aporte sugerido por jugador: S/ {match.player_fee || 0}</Text>

              <ComboSelect
                styles={styles}
                label="Método de pago realizado"
                value={paymentMethods[key] || 'yape'}
                options={paymentMethodOptions}
                onChange={(value) => setPaymentMethods((current) => ({ ...current, [key]: value }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Cantidad de jugadores que cubre el pago"
                placeholderTextColor="#64748b"
                value={paidPlayersCounts[key] || '1'}
                onChangeText={(value) => setPaidPlayersCounts((current) => ({ ...current, [key]: value }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Monto total pagado"
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
