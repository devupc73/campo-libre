import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexInfoEditor from './ComplexInfoEditor';
import DashboardCards from './DashboardCards';
import WeeklyScheduleCalendarStable from './WeeklyScheduleCalendarStable';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexOperations({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState('');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [message, setMessage] = useState('');
  const [calendarEnabled, setCalendarEnabled] = useState(false);

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
    setCalendarEnabled(false);
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

      const response = await fetch(
        update ? `${API_URL}/courts/${courtId}` : `${API_URL}/courts/`,
        {
          method: update ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error();

      const data = await response.json();
      setCourtId(String(data.id));
      setMessage(update ? 'Campo actualizado' : 'Campo creado');
      loadCourts();
    } catch {
      setMessage('No se pudo guardar el campo');
    }
  }

  async function deleteCourt() {
    try {
      await fetch(`${API_URL}/courts/${courtId}`, {
        method: 'DELETE',
      });

      setCourtId('');
      setCourtName('Campo 1');
      setSport('futbol');
      setCapacity('14');
      setCalendarEnabled(false);
      setMessage('Campo eliminado');
      loadCourts();
    } catch {
      setMessage('No se pudo eliminar el campo');
    }
  }

  async function deleteComplex() {
    try {
      await fetch(`${API_URL}/sports-complexes/${selectedComplex?.id}`, {
        method: 'DELETE',
      });

      setMessage('Complejo eliminado');
    } catch {
      setMessage('No se pudo eliminar el complejo');
    }
  }

  const estimatedWeeklyOccupancy = Math.min(courts.length * 15 * 5, 100);

  return (
    <View>
      <Text style={styles.title}>Administración operativa</Text>
      <Text style={styles.subtitle}>Gestiona campos y disponibilidad semanal del complejo.</Text>

      <DashboardCards
        styles={styles}
        items={[
          {
            label: 'Campos registrados',
            value: courts.length,
            description: 'Campos activos del complejo',
          },
          {
            label: 'Ocupabilidad semanal',
            value: `${estimatedWeeklyOccupancy}%`,
            description: 'Estimación semanal basada en calendario',
          },
          {
            label: 'Día pico',
            value: 'Viernes',
            description: 'Mayor ocupación estimada',
          },
          {
            label: 'Semana activa',
            value: calendarEnabled ? 'Activa' : 'Pendiente',
            description: 'Estado calendario semanal',
          },
        ]}
      />

      <ComplexInfoEditor styles={styles} selectedComplex={selectedComplex} />

      <TouchableOpacity style={styles.secondaryButton} onPress={deleteComplex}>
        <Text style={styles.buttonText}>Eliminar complejo</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Campos deportivos</Text>

      <ComboSelect
        styles={styles}
        label="Campo existente"
        value={courtId}
        options={courts.map((court) => ({
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
        <Text style={styles.buttonText}>Actualizar campo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={deleteCourt}>
        <Text style={styles.buttonText}>Eliminar campo</Text>
      </TouchableOpacity>

      {!!courtId && !calendarEnabled && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => setCalendarEnabled(true)}>
          <Text style={styles.buttonText}>Abrir calendario semanal</Text>
        </TouchableOpacity>
      )}

      {!!courtId && calendarEnabled && <WeeklyScheduleCalendarStable styles={styles} courtId={courtId} />}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
