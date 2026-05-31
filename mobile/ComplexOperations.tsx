import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexRateManager from './ComplexRateManager';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexOperations({ styles }: any) {
  const [complexId, setComplexId] = useState('');
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState('');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [basePrice, setBasePrice] = useState('120');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('18:00:00');
  const [endTime, setEndTime] = useState('23:00:00');
  const [slotPrice, setSlotPrice] = useState('150');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCourts();
  }, []);

  async function loadCourts() {
    try {
      const response = await fetch(`${API_URL}/courts/`);
      const data = await response.json();
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los campos.');
    }
  }

  function fillCourt(court: any) {
    setCourtId(String(court.id));
    setComplexId(String(court.complex_id || ''));
    setCourtName(court.name || '');
    setSport(court.sport || 'futbol');
    setCapacity(String(court.capacity || '14'));
    setBasePrice(String(court.price_per_hour || '120'));
  }

  async function saveCourt(update = false) {
    setMessage(update ? 'Actualizando campo...' : 'Creando campo...');
    try {
      const payload = {
        complex_id: Number(complexId),
        name: courtName,
        sport,
        capacity: Number(capacity),
        price_per_hour: Number(basePrice),
      };

      const url = update ? `${API_URL}/courts/${courtId}` : `${API_URL}/courts/`;
      const response = await fetch(url, {
        method: update ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('court_failed');
      const data = await response.json();
      setCourtId(String(data.id));
      setMessage(update ? 'Campo actualizado correctamente.' : `Campo creado. ID ${data.id}`);
      loadCourts();
    } catch {
      setMessage(update ? 'No se pudo actualizar el campo.' : 'No se pudo crear el campo.');
    }
  }

  async function createSchedule() {
    setMessage('Registrando disponibilidad...');
    try {
      const payload = {
        court_id: Number(courtId),
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        price_per_hour: Number(slotPrice),
      };
      const response = await fetch(`${API_URL}/court-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('schedule_failed');
      setMessage('Disponibilidad registrada correctamente.');
    } catch {
      setMessage('No se pudo registrar la disponibilidad.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Operación del complejo</Text>
      <Text style={styles.subtitle}>Crear y actualizar campos, horarios y tarifas.</Text>

      <Text style={styles.subtitle}>Campos deportivos</Text>
      <ComboSelect
        styles={styles}
        label="Seleccionar campo existente"
        value={courtId}
        options={courts.map((court) => ({
          label: `${court.name} - ${court.sport} - S/ ${court.price_per_hour}`,
          value: String(court.id),
        }))}
        onChange={(value) => {
          const court = courts.find((item) => String(item.id) === value);
          if (court) fillCourt(court);
        }}
      />
      <TextInput style={styles.input} placeholder="ID complejo" placeholderTextColor="#64748b" value={complexId} onChangeText={setComplexId} />
      <TextInput style={styles.input} placeholder="Nombre del campo" placeholderTextColor="#64748b" value={courtName} onChangeText={setCourtName} />
      <TextInput style={styles.input} placeholder="Deporte" placeholderTextColor="#64748b" value={sport} onChangeText={setSport} />
      <TextInput style={styles.input} placeholder="Capacidad" placeholderTextColor="#64748b" value={capacity} onChangeText={setCapacity} />
      <TextInput style={styles.input} placeholder="Precio base referencial" placeholderTextColor="#64748b" value={basePrice} onChangeText={setBasePrice} />
      <TouchableOpacity style={styles.primaryButton} onPress={() => saveCourt(false)}><Text style={styles.buttonText}>Crear campo</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => saveCourt(true)}><Text style={styles.buttonText}>Actualizar campo seleccionado</Text></TouchableOpacity>

      <Text style={styles.subtitle}>Disponibilidad semanal</Text>
      <TextInput style={styles.input} placeholder="ID campo" placeholderTextColor="#64748b" value={courtId} onChangeText={setCourtId} />
      <TextInput style={styles.input} placeholder="Día 1=Lunes, 7=Domingo" placeholderTextColor="#64748b" value={dayOfWeek} onChangeText={setDayOfWeek} />
      <TextInput style={styles.input} placeholder="Inicio HH:MM:SS" placeholderTextColor="#64748b" value={startTime} onChangeText={setStartTime} />
      <TextInput style={styles.input} placeholder="Fin HH:MM:SS" placeholderTextColor="#64748b" value={endTime} onChangeText={setEndTime} />
      <TextInput style={styles.input} placeholder="Precio por hora" placeholderTextColor="#64748b" value={slotPrice} onChangeText={setSlotPrice} />
      <TouchableOpacity style={styles.primaryButton} onPress={createSchedule}><Text style={styles.buttonText}>Registrar disponibilidad</Text></TouchableOpacity>

      <ComplexRateManager styles={styles} />

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
