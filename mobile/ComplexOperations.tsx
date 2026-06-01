import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexRateManager from './ComplexRateManager';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function addHour(time: string) {
  const [h, m] = time.split(':').map(Number);
  const next = h + 1;
  return `${String(next).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function getRangeHours(startTime: string, endTime: string) {
  const startHour = Number(startTime.split(':')[0]);
  const endHour = Number(endTime.split(':')[0]);
  return Math.max(endHour - startHour, 0);
}

export default function ComplexOperations({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [courtId, setCourtId] = useState('');
  const [courtName, setCourtName] = useState('Campo 1');
  const [sport, setSport] = useState('futbol');
  const [capacity, setCapacity] = useState('14');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
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
      setMessage('Campo eliminado');
      loadCourts();
    } catch {
      setMessage('No se pudo eliminar el campo');
    }
  }

  async function generateSchedules() {
    if (!courtId) {
      setMessage('Selecciona o crea un campo primero');
      return;
    }

    try {
      let current = `${startTime}:00`;
      const end = `${endTime}:00`;
      let created = 0;

      while (current < end) {
        const next = addHour(current);

        await fetch(`${API_URL}/court-schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            court_id: Number(courtId),
            day_of_week: Number(dayOfWeek),
            start_time: current,
            end_time: next,
            price_per_hour: 0,
          }),
        });

        current = next;
        created += 1;
      }

      setMessage(`${created} franjas horarias generadas automáticamente`);
    } catch {
      setMessage('No se pudieron generar las franjas');
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

  const projectedSlots = getRangeHours(startTime, endTime);
  const estimatedWeeklyOccupancy = Math.min(courts.length * projectedSlots * 5, 100);

  return (
    <View>
      <Text style={styles.title}>Administración operativa</Text>
      <Text style={styles.subtitle}>Gestiona campos, horarios y tarifas del complejo.</Text>

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
            description: 'Estimación en base a franjas',
          },
          {
            label: 'Día con mayor ocupación',
            value: 'Viernes',
            description: 'Mayor concentración estimada',
          },
          {
            label: 'Horas operativas',
            value: projectedSlots,
            description: `${startTime} a ${endTime}`,
          },
        ]}
      />

      <Text style={styles.title}>Complejo</Text>
      <Text style={styles.subtitle}>{selectedComplex?.name}</Text>
      <Text style={styles.moduleText}>{selectedComplex?.address}</Text>

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

      <Text style={styles.title}>Disponibilidad automática</Text>
      <Text style={styles.subtitle}>El sistema generará automáticamente franjas de 1 hora.</Text>

      <TextInput style={styles.input} placeholder="Día 1=Lunes" placeholderTextColor="#64748b" value={dayOfWeek} onChangeText={setDayOfWeek} />
      <TextInput style={styles.input} placeholder="Hora inicio HH:MM" placeholderTextColor="#64748b" value={startTime} onChangeText={setStartTime} />
      <TextInput style={styles.input} placeholder="Hora fin HH:MM" placeholderTextColor="#64748b" value={endTime} onChangeText={setEndTime} />

      <TouchableOpacity style={styles.primaryButton} onPress={generateSchedules}>
        <Text style={styles.buttonText}>Generar franjas automáticas</Text>
      </TouchableOpacity>

      <ComplexRateManager styles={styles} selectedComplex={selectedComplex} />

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
