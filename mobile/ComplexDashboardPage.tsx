import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

export default function ComplexDashboardPage({ styles, selectedComplex, onNavigate }: any) {
  return (
    <View>
      <Text style={styles.title}>Dashboard del complejo</Text>
      <Text style={styles.subtitle}>{selectedComplex?.name}</Text>
      <DashboardCards
        styles={styles}
        items={[
          { label: 'Estado', value: 'Activo', description: 'Complejo seleccionado' },
          { label: 'Operación', value: 'Semanal', description: 'Gestión por calendario' },
          { label: 'Reservas', value: 'Consulta', description: 'Seguimiento operativo' },
          { label: 'Pagos', value: 'Pendiente', description: 'Control financiero manual' },
        ]}
      />
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('settings')}>
        <Text style={styles.moduleTitle}>Datos del complejo</Text>
        <Text style={styles.moduleText}>Editar información general del complejo.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('fields')}>
        <Text style={styles.moduleTitle}>Campos deportivos</Text>
        <Text style={styles.moduleText}>Crear, actualizar o eliminar campos.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('calendar')}>
        <Text style={styles.moduleTitle}>Calendario semanal</Text>
        <Text style={styles.moduleText}>Generar franjas, tarifas y estados.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moduleButton} onPress={() => onNavigate('reports')}>
        <Text style={styles.moduleTitle}>Reportes y consultas</Text>
        <Text style={styles.moduleText}>Reservas, disponibilidad e indicadores.</Text>
      </TouchableOpacity>
    </View>
  );
}
