import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Slot = {
  start_at: string;
  end_at: string;
  total_price: number;
  available: boolean;
};

export default function AvailabilitySlots({ styles }: { styles: any }) {
  const [courtId, setCourtId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-06-01');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState('');

  async function loadAvailability() {
    setMessage('Consultando disponibilidad...');
    setSlots([]);

    try {
      const response = await fetch(`${API_URL}/availability?court_id=${courtId}&target_date=${targetDate}`);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setMessage('No hay slots configurados para esa cancha y fecha.');
        return;
      }

      setSlots(data);
      setMessage(`${data.length} slots encontrados.`);
    } catch {
      setMessage('No se pudo consultar disponibilidad.');
    }
  }

  return (
    <View>
      <Text style={styles.subtitle}>Slots visuales</Text>
      <TextInput style={styles.input} placeholder="ID del campo" placeholderTextColor="#64748b" value={courtId} onChangeText={setCourtId} />
      <TextInput style={styles.input} placeholder="Fecha YYYY-MM-DD" placeholderTextColor="#64748b" value={targetDate} onChangeText={setTargetDate} />
      <TouchableOpacity style={styles.primaryButton} onPress={loadAvailability}>
        <Text style={styles.buttonText}>Ver disponibilidad</Text>
      </TouchableOpacity>

      {slots.map((slot, index) => (
        <View key={`${slot.start_at}-${index}`} style={slot.available ? styles.moduleButton : styles.secondaryButton}>
          <Text style={styles.moduleTitle}>{slot.start_at.substring(11, 16)} - {slot.end_at.substring(11, 16)}</Text>
          <Text style={styles.moduleText}>{slot.available ? 'Disponible' : 'Ocupado'} · S/ {slot.total_price}</Text>
        </View>
      ))}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
