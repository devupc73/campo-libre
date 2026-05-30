import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AvailabilitySlots from './AvailabilitySlots';
import MatchWallet from './MatchWallet';

export default function CaptainDashboard({ styles, userId, onBack }: any) {
  return (
    <View>
      <Text style={styles.title}>Capitán / gestor del equipo</Text>
      <Text style={styles.subtitle}>Crea reservas, organiza jugadores y administra la bolsa del partido.</Text>

      <Text style={styles.subtitle}>Reservar cancha</Text>
      <AvailabilitySlots userId={userId} styles={styles} />

      <Text style={styles.subtitle}>Bolsa del partido</Text>
      <MatchWallet userId={userId} styles={styles} />

      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}
