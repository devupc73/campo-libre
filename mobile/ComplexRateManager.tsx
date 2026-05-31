import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexRateManager({ styles }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const usersResponse = await fetch(`${API_URL}/users/`);
      const courtsResponse = await fetch(`${API_URL}/courts/`);
      setUsers(await usersResponse.json());
      setCourts(await courtsResponse.json());
    } catch {
      setMessage('No se pudieron cargar usuarios/canchas');
    }
  }

  async function saveRate() {
    try {
      const response = await fetch(`${API_URL}/user-rates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(selectedUser),
          court_id: Number(selectedCourt),
          price_per_hour: Number(price),
          description,
        }),
      });

      if (!response.ok) throw new Error();
      setMessage('Tarifa diferenciada registrada');
    } catch {
      setMessage('No se pudo registrar la tarifa');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Tarifas diferenciadas</Text>
      <Text style={styles.subtitle}>Asignar tarifas especiales por usuario y cancha.</Text>

      <ComboSelect
        styles={styles}
        label="Usuario"
        value={selectedUser}
        options={users.map((user) => ({
          label: `${user.full_name} (${user.role})`,
          value: String(user.id),
        }))}
        onChange={setSelectedUser}
      />

      <ComboSelect
        styles={styles}
        label="Cancha"
        value={selectedCourt}
        options={courts.map((court) => ({
          label: court.name,
          value: String(court.id),
        }))}
        onChange={setSelectedCourt}
      />

      <TextInput
        style={styles.input}
        placeholder="Precio especial por hora"
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
        <Text style={styles.buttonText}>Guardar tarifa diferenciada</Text>
      </TouchableOpacity>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
