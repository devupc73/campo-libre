import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexFieldsPage({ styles, selectedComplex, selectedCourtId, onSelectCourt }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState(selectedCourtId || '');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCourts();
  }, [selectedComplex?.id]);

  async function loadCourts() {
    try {
      const response = await fetch(`${API_URL}/courts?complex_id=${selectedComplex?.id}`);
      const data = await response.json();
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los campos');
    }
  }

  function fillCourt(court: any) {
    setCourtId(String(court.id));
    setCourtName(court.name || '');
    setSport(court.sport || 'futbol');
    setCapacity(String(court.capacity || '14'));
    onSelectCourt(String(court.id));
  }

  async function saveCourt(update = false) {
    try {
      const payload = {
        complex_id: Number(selectedComplex?.id),
        name: courtName,
        sport,
        capacity: Number(capacity),
        price_per_hour: 0,
      };

      const response = await fetch(update ? `${API_URL}/courts/${courtId}` : `${API_URL}/courts/`, {
        method: update ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setCourtId(String(data.id));
      onSelectCourt(String(data.id));
      setMessage(update ? 'Campo actualizado' : 'Campo creado');
      await loadCourts();
    } catch {
      setMessage('No se pudo guardar el campo');
    }
  }

  async function deleteCourt() {
    if (!courtId) return;
    try {
      await fetch(`${API_URL}/courts/${courtId}`, { method: 'DELETE' });
      setCourtId('');
      onSelectCourt('');
      setCourtName('Campo 1');
      setSport('futbol');
      setCapacity('14');
      setMessage('Campo eliminado');
      await loadCourts();
    } catch {
      setMessage('No se pudo eliminar el campo');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Campos deportivos</Text>
      <Text style={styles.subtitle}>Crea, selecciona y actualiza campos del complejo.</Text>
      <ComboSelect
        styles={styles}
        label="Campo existente"
        value={courtId}
        options={courts.map((court) => ({ label: `${court.name} - ${court.sport}`, value: String(court.id) }))}
        onChange={(value) => {
          const court = courts.find((item) => String(item.id) === value);
          if (court) fillCourt(court);
        }}
      />
      <TextInput style={styles.input} placeholder="Nombre del campo" placeholderTextColor="#64748b" value={courtName} onChangeText={setCourtName} />
      <TextInput style={styles.input} placeholder="Deporte" placeholderTextColor="#64748b" value={sport} onChangeText={setSport} />
      <TextInput style={styles.input} placeholder="Capacidad" placeholderTextColor="#64748b" value={capacity} onChangeText={setCapacity} />
      <TouchableOpacity style={styles.primaryButton} onPress={() => saveCourt(false)}>
        <Text style={styles.buttonText}>Crear campo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => saveCourt(true)}>
        <Text style={styles.buttonText}>Actualizar campo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={deleteCourt}>
        <Text style={styles.buttonText}>Eliminar campo</Text>
      </TouchableOpacity>
      {!!courtId && <Text style={styles.status}>Campo seleccionado para calendario: {courtId}</Text>}
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
