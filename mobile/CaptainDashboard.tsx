import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function CaptainDashboard({ styles, userId, onBack }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('Pichanga viernes');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('14');
  const [fee, setFee] = useState('25');
  const [paymentDeadline, setPaymentDeadline] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const response = await fetch(`${API_URL}/matches?captain_user_id=${userId}`);
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar las convocatorias');
    }
  }

  async function createMatch() {
    try {
      const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captain_user_id: Number(userId),
          title,
          sport: 'futbol',
          max_players: Number(maxPlayers),
          tentative_location: location,
          match_date: matchDate,
          match_time: matchTime,
          payment_deadline: paymentDeadline,
          player_fee: Number(fee),
          paid_to_complex: 0,
        }),
      });

      if (!response.ok) throw new Error();

      setMessage('Convocatoria creada');
      loadMatches();
    } catch {
      setMessage('No se pudo crear la convocatoria');
    }
  }

  async function openMatch(match: any) {
    setSelectedMatch(match);

    try {
      const participantsResponse = await fetch(`${API_URL}/match-participants?match_id=${match.id}`);
      const participantsData = await participantsResponse.json();
      setParticipants(Array.isArray(participantsData) ? participantsData : []);

      const summaryResponse = await fetch(`${API_URL}/matches/${match.id}/summary`);
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);
    } catch {
      setMessage('No se pudo cargar el detalle de la convocatoria');
    }
  }

  async function registerPayment(participantId: number) {
    try {
      await fetch(`${API_URL}/match-participants/${participantId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'yape',
          paid_amount: Number(selectedMatch?.player_fee || 0),
        }),
      });

      if (selectedMatch) openMatch(selectedMatch);
    } catch {
      setMessage('No se pudo registrar el pago');
    }
  }

  return (
    <ScrollView>
      <Text style={styles.title}>Capitán / gestor del equipo</Text>
      <Text style={styles.subtitle}>Organiza convocatorias, recauda pagos y controla el fondo acumulado.</Text>

      <DashboardCards
        styles={styles}
        items={[
          { label: 'Convocatorias', value: matches.length, description: 'Publicadas por el capitán' },
          { label: 'Fondo acumulado', value: `S/ ${summary?.accumulated_fund || 0}`, description: 'Ingresos menos pago cancha' },
          { label: 'Jugadores confirmados', value: summary?.confirmed_players || 0, description: 'Titulares actuales' },
          { label: 'Reservas', value: summary?.reserve_players || 0, description: 'Lista de espera' },
        ]}
      />

      <Text style={styles.title}>Nueva convocatoria</Text>

      <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Fecha" placeholderTextColor="#64748b" value={matchDate} onChangeText={setMatchDate} />
      <TextInput style={styles.input} placeholder="Hora" placeholderTextColor="#64748b" value={matchTime} onChangeText={setMatchTime} />
      <TextInput style={styles.input} placeholder="Lugar tentativo" placeholderTextColor="#64748b" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Cantidad jugadores" placeholderTextColor="#64748b" value={maxPlayers} onChangeText={setMaxPlayers} />
      <TextInput style={styles.input} placeholder="Pago por jugador" placeholderTextColor="#64748b" value={fee} onChangeText={setFee} />
      <TextInput style={styles.input} placeholder="Fecha límite pago" placeholderTextColor="#64748b" value={paymentDeadline} onChangeText={setPaymentDeadline} />

      <TouchableOpacity style={styles.primaryButton} onPress={createMatch}>
        <Text style={styles.buttonText}>Crear convocatoria</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Convocatorias creadas</Text>

      {matches.map((match) => (
        <TouchableOpacity key={match.id} style={styles.card} onPress={() => openMatch(match)}>
          <Text style={styles.cardTitle}>{match.title}</Text>
          <Text style={styles.moduleText}>{match.match_date} - {match.match_time}</Text>
          <Text style={styles.moduleText}>Lugar: {match.tentative_location || '-'}</Text>
          <Text style={styles.moduleText}>Jugadores: {match.max_players}</Text>
          <Text style={styles.moduleText}>Aporte: S/ {match.player_fee}</Text>
        </TouchableOpacity>
      ))}

      {!!selectedMatch && (
        <View>
          <Text style={styles.title}>Participantes</Text>

          {participants.map((participant) => (
            <View key={participant.id} style={styles.card}>
              <Text style={styles.cardTitle}>Jugador #{participant.user_id}</Text>
              <Text style={styles.moduleText}>Estado: {participant.status}</Text>
              <Text style={styles.moduleText}>Pago: {participant.payment_status}</Text>
              <Text style={styles.moduleText}>Orden: {participant.participant_order}</Text>

              {participant.payment_status !== 'paid' && (
                <TouchableOpacity style={styles.primaryButton} onPress={() => registerPayment(participant.id)}>
                  <Text style={styles.buttonText}>Registrar pago</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {!!message && <Text style={styles.status}>{message}</Text>}

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
