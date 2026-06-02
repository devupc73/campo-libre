import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shuffle(list: any[]) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[randomIndex];
    copy[randomIndex] = temp;
  }
  return copy;
}

export default function TeamDraw({ styles, selectedMatch, participants }: any) {
  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const eligiblePlayers = useMemo(
    () => participants.filter((player: any) => player.status === 'confirmed'),
    [participants],
  );

  const hasOfficialField = !!selectedMatch?.court_id && !!selectedMatch?.schedule_id;
  const isMatchDay = selectedMatch?.match_date === todayIso();
  const canDraw = hasOfficialField && isMatchDay && eligiblePlayers.length >= 2;

  function drawTeams() {
    if (!canDraw) {
      setMessage('El sorteo se habilita el día de la reserva, con campo y franja oficial asociados.');
      return;
    }

    const shuffled = shuffle(eligiblePlayers);
    const firstTeam: any[] = [];
    const secondTeam: any[] = [];

    shuffled.forEach((player, index) => {
      if (index % 2 === 0) firstTeam.push(player);
      else secondTeam.push(player);
    });

    setTeamA(firstTeam);
    setTeamB(secondTeam);
    setMessage('Sorteo realizado entre jugadores confirmados.');
  }

  if (!selectedMatch) return null;

  return (
    <View>
      <Text style={styles.title}>Sorteo de equipos</Text>
      <Text style={styles.subtitle}>Disponible solo el día de la reserva oficial del campo.</Text>

      <Text style={styles.moduleText}>Fecha partido: {selectedMatch.match_date || '-'}</Text>
      <Text style={styles.moduleText}>Jugadores confirmados: {eligiblePlayers.length}</Text>
      <Text style={styles.moduleText}>Campo oficial: {hasOfficialField ? 'Sí' : 'Pendiente'}</Text>
      <Text style={styles.moduleText}>Día habilitado: {isMatchDay ? 'Sí' : 'No'}</Text>

      <TouchableOpacity style={canDraw ? styles.primaryButton : styles.secondaryButton} onPress={drawTeams}>
        <Text style={styles.buttonText}>Sortear equipos</Text>
      </TouchableOpacity>

      {!!teamA.length && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Equipo A</Text>
          {teamA.map((player) => (
            <Text key={`a-${player.id}`} style={styles.moduleText}>Jugador #{player.user_id}</Text>
          ))}
        </View>
      )}

      {!!teamB.length && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Equipo B</Text>
          {teamB.map((player) => (
            <Text key={`b-${player.id}`} style={styles.moduleText}>Jugador #{player.user_id}</Text>
          ))}
        </View>
      )}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
