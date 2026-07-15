import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import DashboardCards from './DashboardCards';
import { SportsHero, SportsPill, SportsSectionTitle } from './SportsBrand';

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
  const [message, setMessage] = useState('');

  useEffect(() => { loadMyMatches(); }, []);

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
      setMatches(rows); hydrateDefaults(rows);
    } catch { setMessage('No se pudieron cargar tus convocatorias inscritas.'); }
  }

  async function searchByCode() {
    const code = invitationCode.trim().toUpperCase();
    if (!code) { setMessage('Ingresa el código privado de la convocatoria.'); return; }
    try {
      const response = await fetch(`${API_URL}/matches?invitation_code=${encodeURIComponent(code)}`);
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) { setMessage('No se encontró una convocatoria con ese código.'); return; }
      const existingIds = new Set(matches.map((match) => String(match.id)));
      const merged = [...rows, ...matches.filter((match) => !existingIds.has(String(match.id)))];
      setMatches(merged); hydrateDefaults(merged); setMessage('¡Partido encontrado! Ya puedes inscribirte.');
    } catch { setMessage('No se pudo buscar la convocatoria por código.'); }
  }

  async function joinMatch(matchId: number) {
    const key = String(matchId);
    try {
      const response = await fetch(`${API_URL}/match-participants`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, user_id: Number(userId), position: '', skill_level: 3, payment_method: paymentMethods[key] || 'yape', paid_amount: Number(paymentAmounts[key] || 0), paid_players_count: Math.max(Number(paidPlayersCounts[key] || 1), 1), payment_operation_code: operationCodes[key] || '', payment_receipt_url: '' }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(data.payment_status === 'paid' ? 'Inscripción registrada. El capitán validará tu pago.' : 'Inscripción registrada con pago pendiente.');
      await loadMyMatches();
    } catch { setMessage('No se pudo registrar la inscripción.'); }
  }

  return <View>
    <SportsHero eyebrow="JUGADOR" title="Tu próximo partido te espera" subtitle="Únete con el código de tu equipo, confirma tu aporte y sigue el avance de la convocatoria." icon="⚽" badge={`${matches.length} partidos visibles`} />
    <SportsSectionTitle title="Buscar convocatoria" subtitle="Ingresa el código privado compartido por el capitán" icon="🔎" />
    <View style={{ backgroundColor: '#0d1b2d', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#27405a' }}>
      <TextInput style={styles.input} placeholder="Código privado, por ejemplo ABC123" placeholderTextColor="#718198" value={invitationCode} onChangeText={(value) => setInvitationCode(value.toUpperCase())} />
      <TouchableOpacity style={styles.primaryButton} onPress={searchByCode}><Text style={styles.buttonText}>Encontrar mi partido</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={loadMyMatches}><Text style={styles.buttonText}>Actualizar convocatorias</Text></TouchableOpacity>
    </View>

    <SportsSectionTitle title="Mis partidos" subtitle="Convocatorias encontradas e inscripciones" icon="🏆" />
    <ScrollView style={{ maxHeight: 680 }}>
      {matches.map((match) => {
        const key = String(match.id);
        return <View key={match.id} style={{ ...styles.moduleButton, marginBottom: 14, padding: 20 } as any}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{match.title}</Text><Text style={styles.moduleText}>{match.match_date || 'Fecha por definir'} · {match.match_time || 'Hora por definir'}</Text></View>
            <SportsPill text={match.status || 'convocatoria'} tone="green" />
          </View>
          <Text style={styles.moduleText}>📍 {match.tentative_location || 'Lugar por confirmar'}</Text>
          <Text style={styles.moduleText}>🔑 Código: {match.invitation_code || '-'}</Text>
          <DashboardCards styles={styles} items={[
            { label: 'Inscritos', value: match.total_players || 0, description: 'Total apuntados' },
            { label: 'Confirmados', value: `${match.confirmed_players || 0}/${match.max_players || 0}`, description: 'Titulares' },
            { label: 'Disponibles', value: match.available_slots || 0, description: 'Cupos libres' },
            { label: 'Aporte', value: `S/ ${match.player_fee || 0}`, description: 'Por jugador' },
          ]} />
          <SportsSectionTitle title="Registrar mi aporte" icon="💳" />
          <ComboSelect styles={styles} label="Método de pago" value={paymentMethods[key] || 'yape'} options={paymentMethodOptions} onChange={(value) => setPaymentMethods((current) => ({ ...current, [key]: value }))} />
          <TextInput style={styles.input} placeholder="Jugadores cubiertos por el pago" placeholderTextColor="#718198" value={paidPlayersCounts[key] || '1'} onChangeText={(value) => setPaidPlayersCounts((current) => ({ ...current, [key]: value }))} />
          <TextInput style={styles.input} placeholder="Monto total pagado" placeholderTextColor="#718198" value={paymentAmounts[key] || String(match.player_fee || 0)} onChangeText={(value) => setPaymentAmounts((current) => ({ ...current, [key]: value }))} />
          <TextInput style={styles.input} placeholder="Número de operación" placeholderTextColor="#718198" value={operationCodes[key] || ''} onChangeText={(value) => setOperationCodes((current) => ({ ...current, [key]: value }))} />
          <TouchableOpacity style={styles.primaryButton} onPress={() => joinMatch(match.id)}><Text style={styles.buttonText}>Inscribirme y registrar pago</Text></TouchableOpacity>
        </View>;
      })}
    </ScrollView>
    {!matches.length && <Text style={styles.muted}>Todavía no tienes partidos. Busca una convocatoria con su código privado.</Text>}
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
