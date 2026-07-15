import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function getError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

export default function ComplexFieldsPage({ styles, selectedComplex, selectedCourtId, onSelectCourt }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState(selectedCourtId || '');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCourtId(selectedCourtId || '');
  }, [selectedCourtId]);

  useEffect(() => {
    clearForm();
    loadCourts();
  }, [selectedComplex?.id]);

  async function loadCourts(preferredId = '') {
    try {
      const response = await fetch(`${API_URL}/courts/?complex_id=${selectedComplex?.id}`);
      if (!response.ok) throw new Error(await getError(response));
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setCourts(items);
      const idToSelect = preferredId || courtId;
      const selected = items.find((item) => String(item.id) === idToSelect);
      if (selected) fillCourt(selected);
      else if (idToSelect) clearForm();
    } catch (error: any) {
      setMessage(error.message || 'No se pudieron cargar los campos');
    }
  }

  function clearForm() {
    setCourtId('');
    setCourtName('Campo 1');
    setSport('futbol');
    setCapacity('14');
    onSelectCourt('');
  }

  function fillCourt(court: any) {
    setCourtId(String(court.id));
    setCourtName(court.name || '');
    setSport(court.sport || 'futbol');
    setCapacity(String(court.capacity || 14));
    onSelectCourt(String(court.id));
  }

  async function saveCourt(update = false) {
    if (update && !courtId) {
      setMessage('Selecciona un campo antes de actualizarlo.');
      return;
    }
    if (!courtName.trim()) {
      setMessage('El nombre del campo es obligatorio.');
      return;
    }
    if (!Number(capacity) || Number(capacity) <= 0) {
      setMessage('La capacidad debe ser mayor a cero.');
      return;
    }

    try {
      const payload = {
        complex_id: Number(selectedComplex?.id),
        name: courtName.trim(),
        sport: sport.trim() || 'futbol',
        capacity: Number(capacity),
        price_per_hour: 0,
      };
      const response = await fetch(update ? `${API_URL}/courts/${courtId}` : `${API_URL}/courts/`, {
        method: update ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getError(response));
      const data = await response.json();
      fillCourt(data);
      setMessage(update ? 'Campo actualizado correctamente.' : 'Campo creado correctamente.');
      await loadCourts(String(data.id));
    } catch (error: any) {
      setMessage(error.message || 'No se pudo guardar el campo');
    }
  }

  async function deleteCourt() {
    if (!courtId) {
      setMessage('Selecciona un campo antes de eliminarlo.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/courts/${courtId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await getError(response));
      const data = await response.json();
      clearForm();
      setMessage(data.unlinked_matches ? `Campo eliminado. Se desvincularon ${data.unlinked_matches} convocatorias.` : 'Campo eliminado correctamente.');
      await loadCourts();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo eliminar el campo');
    }
  }

  return <View>
    <Text style={styles.title}>Campos deportivos</Text>
    <Text style={styles.subtitle}>Selecciona un campo para modificarlo o eliminarlo.</Text>
    <ComboSelect styles={styles} label="Campo existente" value={courtId} options={courts.map((court) => ({ label: `${court.name} - ${court.sport}`, value: String(court.id) }))} onChange={(value) => {
      const court = courts.find((item) => String(item.id) === value);
      if (court) fillCourt(court);
    }} />
    <TextInput style={styles.input} placeholder="Nombre del campo" placeholderTextColor="#64748b" value={courtName} onChangeText={setCourtName} />
    <TextInput style={styles.input} placeholder="Deporte" placeholderTextColor="#64748b" value={sport} onChangeText={setSport} />
    <TextInput style={styles.input} placeholder="Capacidad" placeholderTextColor="#64748b" value={capacity} onChangeText={setCapacity} />
    <TouchableOpacity style={styles.primaryButton} onPress={() => saveCourt(false)}><Text style={styles.buttonText}>Crear nuevo campo</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={() => saveCourt(true)}><Text style={styles.buttonText}>Guardar cambios</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={deleteCourt}><Text style={styles.buttonText}>Eliminar campo seleccionado</Text></TouchableOpacity>
    {!!courtId && <Text style={styles.status}>Campo seleccionado: {courtName}</Text>}
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
