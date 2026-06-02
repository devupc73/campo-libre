import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function PlayerConvocations({ styles, userId }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const response = await fetch(`${API_URL}/matches`);
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar las convocatorias.');
    }
  }

  async function joinMatch(matchId: number) {
    try {
      const response = await fetch(`${API_URL}/match-participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          user_id: Number(userId),
          position: '',
          skill_level: 3,
        }),
      });

      if (!response.ok) throw new Error();
      setMessage('Inscripción registrada.');
      loadMatches();
    } catch {
      setMessage('No se pudo registrar la inscripción.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Convocatorias disponibles</Text>
      <Text style={styles.subtitle}>Inscríbete a partidos publicados por capitanes.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={loadMatches}>
        <Text style={styles.buttonText}>Actualizar convocatorias</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 520 }}>
        {matches.map((match) => (
          <View key={match.id} style={styles.card}>
            <Text style={styles.cardTitle}>{match.title}</Text>
            <Text style={styles.moduleText}>Fecha: {match.match_date || '-'}</Text>
            <Text style={styles.moduleText}>Hora: {match.match_time || '-'}</Text>
            <Text style={styles.moduleText}>Lugar tentativo: {match.tentative_location || '-'}</Text>
            <Text style={styles.moduleText}>Cupos: {match.max_players}</Text>
            <Text style={styles.moduleText}>Aporte: S/ {match.player_fee || 0}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => joinMatch(match.id)}>
              <Text style={styles.buttonText}>Inscribirme</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
