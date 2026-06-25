import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

export default function CaptainDashboardHome({ styles, matches, summary, pendingPaymentsCount, onNavigate }: any) {
  return (
    <View>
      <Text style={styles.title}>Panel del gestor</Text>
      <Text style={styles.subtitle}>Gestiona convocatorias, pagos y reserva oficial desde páginas separadas.</Text>
      <DashboardCards
        styles={styles}
        items={[
          { label: 'Convocatorias', value: matches.length, description: 'Creadas por el gestor' },
          { label: 'Fondo', value: `S/ ${summary?.accumulated_fund || 0}`, description: 'Saldo validado' },
          { label: 'Pagos por validar', value: pendingPaymentsCount || 0, description: 'Jugadores' },
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
