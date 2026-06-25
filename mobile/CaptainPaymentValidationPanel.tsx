import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function CaptainPaymentValidationPanel({ styles, participants, onValidate }: any) {
  const pendingPayments = participants.filter((participant: any) => participant.payment_status === 'paid' && participant.payment_validation_status === 'pending_validation');
  const observedPayments = participants.filter((participant: any) => participant.payment_status === 'paid' && participant.payment_validation_status === 'observed');
  const items = [...pendingPayments, ...observedPayments];

  return (
    <View>
      <Text style={styles.title}>Validación de pagos de jugadores</Text>
      <Text style={styles.subtitle}>Revisa monto y número de operación antes de aprobar el pago.</Text>

      {items.length === 0 ? (
        <Text style={styles.status}>No hay pagos pendientes u observados para esta convocatoria.</Text>
      ) : (
        items.map((participant: any) => (
          <View key={`validation-${participant.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>Jugador #{participant.user_id}</Text>
            <Text style={styles.moduleText}>Estado participante: {participant.status}</Text>
            <Text style={styles.moduleText}>Estado validación: {participant.payment_validation_status || '-'}</Text>
            <Text style={styles.moduleText}>Método: {participant.payment_method || '-'}</Text>
            <Text style={styles.moduleText}>Monto declarado: S/ {participant.paid_amount || 0}</Text>
            <Text style={styles.moduleText}>Jugadores cubiertos: {participant.paid_players_count || 1}</Text>
            <Text style={styles.moduleText}>Número de operación: {participant.payment_operation_code || '-'}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => onValidate(participant.id, 'validated')}>
              <Text style={styles.buttonText}>Validar pago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onValidate(participant.id, 'observed')}>
              <Text style={styles.buttonText}>Observar pago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onValidate(participant.id, 'rejected')}>
              <Text style={styles.buttonText}>Rechazar pago</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}
