import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

export default function ComplexDashboardPage({ styles, selectedComplex, onNavigate }: any) {
  return (
    <View>
      <Text style={styles.title}>Panel del complejo</Text>
      <Text style={styles.subtitle}>{selectedComplex?.name}</Text>
      <DashboardCards
        styles={styles}
        items={[
          { label: 'Complejo', value: selectedComplex?.name ? 'Activo' : 'Pendiente', description: 'Estado de selección' },
          { label: 'Gestión', value: 'Operativa', description: 'Campos, calendario y pagos' },
          { label: 'Pagos', value: 'Validación', description: 'Pagos de capitanes' },
        ]}
      />
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('settings')}>
        <Text style={styles.moduleTitle}>Datos del complejo</Text>
        <Text style={styles.moduleText}>Editar información general y medios de pago.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('fields')}>
        <Text style={styles.moduleTitle}>Campos deportivos</Text>
        <Text style={styles.moduleText}>Mantenimiento independiente de campos.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('calendar')}>
        <Text style={styles.moduleTitle}>Calendario semanal</Text>
        <Text style={styles.moduleText}>Franjas activas, inactivas y reservadas.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('reports')}>
        <Text style={styles.moduleTitle}>Pagos, reservas y reportes</Text>
        <Text style={styles.moduleText}>Validaciones y consultas operativas.</Text>
      </TouchableOpacity>
    </View>
  );
}
