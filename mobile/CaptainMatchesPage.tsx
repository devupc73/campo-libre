import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function CaptainMatchesPage({ styles, matches, onOpenMatch }: any) {
  return (
    <View>
      <Text style={styles.title}>Mis convocatorias</Text>
      <Text style={styles.subtitle}>Selecciona una convocatoria para ver detalle, pagos y reserva oficial.</Text>
      {matches.map((match: any) => (
        <TouchableOpacity key={match.id} style={styles.card} onPress={() => onOpenMatch(match)}>
          <Text style={styles.cardTitle}>{match.title}</Text>
          <Text style={styles.moduleText}>Código privado: {match.invitation_code || '-'}</Text>
          <Text style={styles.moduleText}>{match.match_date || '-'} - {match.match_time || '-'}</Text>
          <Text style={styles.moduleText}>Jugadores: {match.confirmed_players || 0}/{match.max_players}</Text>
          <Text style={styles.moduleText}>Pagos por validar: {match.pending_validation_players || 0}</Text>
          <Text style={styles.moduleText}>Campo: {match.court_id ? 'Asociado' : 'Pendiente'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
