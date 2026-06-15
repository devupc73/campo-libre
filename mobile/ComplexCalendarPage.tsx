import React from 'react';
import { Text, View } from 'react-native';
import WeeklyScheduleCalendarStable from './WeeklyScheduleCalendarStable';

export default function ComplexCalendarPage({ styles, courtId }: any) {
  if (!courtId) {
    return (
      <View>
        <Text style={styles.title}>Calendario semanal</Text>
        <Text style={styles.subtitle}>Primero selecciona o crea un campo deportivo.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Calendario semanal</Text>
      <Text style={styles.subtitle}>Gestiona disponibilidad, tarifas y activación por franja.</Text>
      <WeeklyScheduleCalendarStable styles={styles} courtId={courtId} />
    </View>
  );
}
