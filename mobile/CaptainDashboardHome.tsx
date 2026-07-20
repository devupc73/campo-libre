import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

export default function CaptainDashboardHome({ styles, matches, onNavigate }: any) {
  const validatedTotal = matches.reduce(
    (sum: number, match: any) => sum + Number(match.validated_collected_amount ?? match.collected_amount ?? 0),
    0,
  );
  const declaredTotal = matches.reduce(
    (sum: number, match: any) => sum + Number(match.declared_collected_amount ?? match.collected_amount ?? 0),
    0,
  );
  const pendingValidationTotal = Math.max(declaredTotal - validatedTotal, 0);
  const paidToComplexTotal = matches.reduce(
    (sum: number, match: any) => sum + Number(match.paid_to_complex || 0),
    0,
  );
  const availableBalance = validatedTotal - paidToComplexTotal;

  return (
    <View>
      <Text style={styles.title}>Panel del gestor</Text>
      <Text style={styles.subtitle}>Gestiona convocatorias, pagos y reserva oficial desde páginas separadas.</Text>
      <DashboardCards
        styles={styles}
        items={[
          { label: 'Convocatorias', value: matches.length, description: 'Creadas por el gestor' },
          { label: 'Total validado', value: money(validatedTotal), description: 'Pagos aprobados de jugadores' },
          { label: 'Por validar', value: money(pendingValidationTotal), description: 'Pagos registrados pendientes' },
          { label: 'Pagado a complejos', value: money(paidToComplexTotal), description: 'Transferencias registradas' },
          { label: 'Saldo', value: money(availableBalance), description: 'Validado menos pago a complejos' },
        ]}
      />
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('create')}>
        <Text style={styles.moduleTitle}>Nueva convocatoria</Text>
        <Text style={styles.moduleText}>Crear convocatoria privada y obtener código.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('matches')}>
        <Text style={styles.moduleTitle}>Mis convocatorias</Text>
        <Text style={styles.moduleText}>Revisar convocatorias creadas y participantes.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('payments')}>
        <Text style={styles.moduleTitle}>Validación de pagos</Text>
        <Text style={styles.moduleText}>Aprobar, observar o rechazar pagos de jugadores.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('official')}>
        <Text style={styles.moduleTitle}>Reserva oficial</Text>
        <Text style={styles.moduleText}>Asociar complejo, campo, franja y pago al complejo.</Text>
      </TouchableOpacity>
    </View>
  );
}
