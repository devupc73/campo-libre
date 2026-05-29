import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Slot = {
  court_id?: number;
  start_at: string;
  end_at: string;
  total_price: number;
  available: boolean;
};

type Props = {
  styles: any;
  userId?: string;
};

export default function AvailabilitySlots({ styles, userId }: Props) {
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

  async function reserveSlot(slot: Slot) {
    setMessage('Reservando slot...');

    try {
      const payload = {
        court_id: Number(courtId),
        captain_id: Number(userId || 1),
        start_at: slot.start_at,
        end_at: slot.end_at,
      };

      const response = await fetch(`${API_URL}/reservations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        setMessage('Ese slot ya fue reservado. Actualiza disponibilidad.');
        return;
      }

      if (!response.ok) throw new Error('reservation_failed');

      const data = await response.json();
      setMessage(`Reserva creada. Total calculado S/ ${data.total_price}`);
      loadAvailability();
    } catch {
      setMessage('No se pudo reservar el slot.');
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
        <TouchableOpacity
          key={`${slot.start_at}-${index}`}
          disabled={!slot.available}
          style={slot.available ? styles.moduleButton : styles.secondaryButton}
          onPress={() => reserveSlot(slot)}
        >
          <Text style={styles.moduleTitle}>{slot.start_at.substring(11, 16)} - {slot.end_at.substring(11, 16)}</Text>
          <Text style={styles.moduleText}>{slot.available ? 'Disponible' : 'Ocupado'} · S/ {slot.total_price}</Text>
          <Text style={styles.moduleText}>{slot.available ? 'Tocar para reservar' : 'No disponible'}</Text>
        </TouchableOpacity>
      ))}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
