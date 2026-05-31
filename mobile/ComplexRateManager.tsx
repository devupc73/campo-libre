import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexRateManager({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('18:00:00');
  const [endTime, setEndTime] = useState('19:00:00');
  const [price, setPrice] = useState('120');
  const [description, setDescription] = useState('Horario regular');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCourts();
  }, []);

  async function loadCourts() {
    try {
      const courtsResponse = await fetch(`${API_URL}/courts/`);
      setCourts(await courtsResponse.json());
    } catch {
      setMessage('No se pudieron cargar las canchas');
    }
  }

  async function saveRate() {
    try {
      const response = await fetch(`${API_URL}/complex-admin/court-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complex_id: Number(selectedComplex?.id),
          court_id: Number(selectedCourt),
          day_of_week: Number(dayOfWeek),
          start_time: startTime,
          end_time: endTime,
          price_per_hour: Number(price),
          description,
        }),
      });

      if (!response.ok) throw new Error();

      setMessage('Tarifa por franja horaria registrada correctamente');
    } catch {
      setMessage('No se pudo registrar la tarifa');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Tarifas por franja horaria</Text>
      <Text style={styles.subtitle}>Configura tarifas diarias por cancha y ventana horaria.</Text>

      <ComboSelect
        styles={styles}
        label="Cancha"
        value={selectedCourt}
        options={courts
          .filter((court) => Number(court.complex_id) === Number(selectedComplex?.id))
          .map((court) => ({
            label: `${court.name} - ${court.sport}`,
            value: String(court.id),
          }))}
        onChange={setSelectedCourt}
      />

      <TextInput
        style={styles.input}
        placeholder="Día 1=Lunes, 7=Domingo"
        placeholderTextColor="#64748b"
        value={dayOfWeek}
        onChangeText={setDayOfWeek}
      />

      <TextInput
        style={styles.input}
        placeholder="Inicio HH:MM:SS"
        placeholderTextColor="#64748b"
        value={startTime}
        onChangeText={setStartTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Fin HH:MM:SS"
        placeholderTextColor="#64748b"
        value={endTime}
        onChangeText={setEndTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Tarifa por hora"
        placeholderTextColor="#64748b"
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        style={styles.input}
        placeholder="Descripción"
        placeholderTextColor="#64748b"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={saveRate}>
        <Text style={styles.buttonText}>Guardar tarifa</Text>
      </TouchableOpacity>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
