import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexRateManager from './ComplexRateManager';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexOperations({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState('');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('18:00:00');
  const [endTime, setEndTime] = useState('23:00:00');
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
    setCourtName(court.name || '');
    setSport(court.sport || 'futbol');
    setCapacity(String(court.capacity || '14'));
  }

  async function saveCourt(update = false) {
    setMessage(update ? 'Actualizando campo...' : 'Creando campo...');
    try {
      const payload = {
        complex_id: Number(selectedComplex?.id),
        name: courtName,
        sport,
        capacity: Number(capacity),
        price_per_hour: 0,
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
        price_per_hour: 0,
      };

      const response = await fetch(`${API_URL}/court-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('schedule_failed');

      setMessage('Disponibilidad registrada correctamente. Ahora configura las tarifas por franja horaria.');
    } catch {
      setMessage('No se pudo registrar la disponibilidad.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Operación del complejo</Text>
      <Text style={styles.subtitle}>Administra campos, disponibilidad y tarifas diarias por franja horaria.</Text>

      <Text style={styles.subtitle}>Campos deportivos</Text>

      <ComboSelect
        styles={styles}
        label="Seleccionar campo existente"
        value={courtId}
        options={courts
          .filter((court) => Number(court.complex_id) === Number(selectedComplex?.id))
          .map((court) => ({
            label: `${court.name} - ${court.sport}`,
            value: String(court.id),
          }))}
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
        <Text style={styles.buttonText}>Actualizar campo seleccionado</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Disponibilidad semanal</Text>

      <ComboSelect
        styles={styles}
        label="Campo"
        value={courtId}
        options={courts
          .filter((court) => Number(court.complex_id) === Number(selectedComplex?.id))
          .map((court) => ({
            label: `${court.name} - ${court.sport}`,
            value: String(court.id),
          }))}
        onChange={setCourtId}
      />

      <TextInput style={styles.input} placeholder="Día 1=Lunes, 7=Domingo" placeholderTextColor="#64748b" value={dayOfWeek} onChangeText={setDayOfWeek} />
      <TextInput style={styles.input} placeholder="Inicio HH:MM:SS" placeholderTextColor="#64748b" value={startTime} onChangeText={setStartTime} />
      <TextInput style={styles.input} placeholder="Fin HH:MM:SS" placeholderTextColor="#64748b" value={endTime} onChangeText={setEndTime} />

      <TouchableOpacity style={styles.primaryButton} onPress={createSchedule}>
        <Text style={styles.buttonText}>Registrar disponibilidad</Text>
      </TouchableOpacity>

      <ComplexRateManager styles={styles} selectedComplex={selectedComplex} />

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
