import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function dayName(day: number) {
  const days: any = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
  };
  return days[day] || `Día ${day}`;
}

export default function ComplexRateManager({ styles, selectedComplex }: any) {
  const [courts, setCourts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [price, setPrice] = useState('120');
  const [description, setDescription] = useState('Tarifa por franja');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCourts();
    loadRates();
  }, [selectedComplex?.id]);

  async function loadCourts() {
    try {
      const courtsResponse = await fetch(`${API_URL}/courts/`);
      const data = await courtsResponse.json();
      setCourts(Array.isArray(data) ? data : []);
    } catch {
      setMessage('No se pudieron cargar los campos');
    }
  }

  async function loadRates() {
    try {
      const response = await fetch(`${API_URL}/complex-admin/court-rates/${selectedComplex?.id}`);
      const data = await response.json();
      setRates(Array.isArray(data) ? data : []);
    } catch {
      setRates([]);
    }
  }

  async function loadSchedules(courtId: string) {
    setSelectedSchedule('');

    try {
      const response = await fetch(`${API_URL}/court-schedules?court_id=${courtId}`);
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      setSchedules([]);
      setMessage('No se pudieron cargar las franjas horarias');
    }
  }

  async function saveRate() {
    const schedule = schedules.find((item) => String(item.id) === selectedSchedule);

    if (!schedule) {
      setMessage('Selecciona una franja horaria creada previamente.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/complex-admin/court-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complex_id: Number(selectedComplex?.id),
          court_id: Number(selectedCourt),
          court_schedule_id: Number(selectedSchedule),
          day_of_week: Number(schedule.day_of_week),
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          price_per_hour: Number(price),
          description,
        }),
      });

      if (!response.ok) throw new Error();

      setMessage('Tarifa registrada para la franja seleccionada');
      loadRates();
    } catch {
      setMessage('No se pudo registrar la tarifa');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Tarifas por franja horaria</Text>
      <Text style={styles.subtitle}>Visualiza y administra disponibilidad y precios registrados.</Text>

      <ComboSelect
        styles={styles}
        label="Campo"
        value={selectedCourt}
        options={courts
          .filter((court) => Number(court.complex_id) === Number(selectedComplex?.id))
          .map((court) => ({
            label: `${court.name} - ${court.sport}`,
            value: String(court.id),
          }))}
        onChange={(value) => {
          setSelectedCourt(value);
          loadSchedules(value);
        }}
      />

      <ComboSelect
        styles={styles}
        label="Franja horaria disponible"
        value={selectedSchedule}
        options={schedules.map((schedule) => ({
          label: `${dayName(Number(schedule.day_of_week))} ${schedule.start_time} - ${schedule.end_time}`,
          value: String(schedule.id),
        }))}
        onChange={setSelectedSchedule}
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
        <Text style={styles.buttonText}>Guardar tarifa para esta franja</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Disponibilidad y precios registrados</Text>

      <ScrollView style={{ maxHeight: 320 }}>
        {rates.map((rate, index) => {
          const court = courts.find((item) => Number(item.id) === Number(rate.court_id));

          return (
            <View key={`${rate.id}-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{court?.name || 'Campo'} - {court?.sport || ''}</Text>
              <Text style={styles.moduleText}>{dayName(Number(rate.day_of_week))}</Text>
              <Text style={styles.moduleText}>{rate.start_time} - {rate.end_time}</Text>
              <Text style={styles.moduleText}>S/ {rate.price_per_hour}</Text>
              <Text style={styles.moduleText}>{rate.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
