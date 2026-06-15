import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function CaptainPaymentValidationSummary({ styles, matches, onOpenMatch }: any) {
  const matchesWithPending = matches.filter((match: any) => Number(match.pending_validation_players || 0) > 0);

  return (
    <View>
      <Text style={styles.title}>Validación de pagos</Text>
      <Text style={styles.subtitle}>Selecciona una convocatoria para validar pagos declarados por los jugadores.</Text>

      {matchesWithPending.length === 0 ? (
        <Text style={styles.status}>No hay pagos pendientes de validación en este momento.</Text>
      ) : (
        matchesWithPending.map((match: any) => (
          <View key={`validation-${match.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{match.title}</Text>
            <Text style={styles.moduleText}>Fecha: {match.match_date || '-'} {match.match_time || ''}</Text>
            <Text style={styles.moduleText}>Pagos por validar: {match.pending_validation_players || 0}</Text>
            <Text style={styles.moduleText}>Recaudado declarado: S/ {match.collected_amount || 0}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => onOpenMatch(match)}>
              <Text style={styles.buttonText}>Abrir validación de pagos</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}
