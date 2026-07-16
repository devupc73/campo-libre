import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ComplexLocationCard from './ComplexLocationCard';
import DashboardCards from './DashboardCards';
import { SportsPill, SportsSectionTitle } from './SportsBrand';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Coordinates = { latitude: number; longitude: number };

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLng = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function responseError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

export default function CaptainNearbyComplexes({ styles }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState('Solicita tu ubicación para ordenar los complejos por cercanía.');
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [complexResponse, courtResponse] = await Promise.all([
        fetch(`${API_URL}/sports-complexes`),
        fetch(`${API_URL}/courts`),
      ]);
      if (!complexResponse.ok) throw new Error(await responseError(complexResponse));
      if (!courtResponse.ok) throw new Error(await responseError(courtResponse));
      const complexData = await complexResponse.json();
      const courtData = await courtResponse.json();
      setComplexes(Array.isArray(complexData) ? complexData.filter((item) => item.status !== 'inactive') : []);
      setCourts(Array.isArray(courtData) ? courtData.filter((item) => item.status !== 'inactive') : []);
    } catch (error: any) {
      setMessage(error.message || 'No se pudieron cargar los complejos deportivos.');
    }
  }

  function requestLocation() {
    setMessage('');
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('La ubicación automática está disponible en la versión web del portal.');
      return;
    }
    setLocationStatus('Obteniendo tu posición actual...');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude });
        setLocationStatus('Complejos ordenados desde tu posición actual.');
      },
      (error) => {
        setLocationStatus(error.code === 1 ? 'Permiso de ubicación denegado. Habilítalo en el navegador para ordenar por cercanía.' : 'No fue posible obtener tu ubicación actual.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }

  const rankedComplexes = useMemo(() => complexes.map((complex) => {
    const complexCourts = courts.filter((court) => Number(court.complex_id) === Number(complex.id));
    const validCoordinates = Number.isFinite(Number(complex.latitude)) && Number.isFinite(Number(complex.longitude));
    const distance = position && validCoordinates
      ? distanceKm(position, { latitude: Number(complex.latitude), longitude: Number(complex.longitude) })
      : null;
    const totalCapacity = complexCourts.reduce((sum, court) => sum + Number(court.capacity || 0), 0);
    const maxCourtCapacity = complexCourts.reduce((max, court) => Math.max(max, Number(court.capacity || 0)), 0);
    const sports = Array.from(new Set(complexCourts.map((court) => court.sport).filter(Boolean)));
    return { ...complex, distance, complexCourts, totalCapacity, maxCourtCapacity, sports };
  }).sort((a, b) => {
    if (a.distance == null && b.distance == null) return String(a.name).localeCompare(String(b.name));
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  }), [complexes, courts, position]);

  function openDirections(complex: any) {
    const destination = Number.isFinite(Number(complex.latitude)) && Number.isFinite(Number(complex.longitude))
      ? `${complex.latitude},${complex.longitude}`
      : complex.address || complex.name;
    const origin = position ? `&origin=${position.latitude},${position.longitude}` : '';
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${origin}`);
  }

  return <View>
    <SportsSectionTitle title="Complejos cercanos" subtitle="Compara ubicación, campos y capacidad antes de asociar tu convocatoria." icon="📍" />
    <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}><Text style={styles.buttonText}>Usar mi ubicación actual</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={loadData}><Text style={styles.buttonText}>Actualizar complejos</Text></TouchableOpacity>
    <Text style={styles.status}>{locationStatus}</Text>

    <ScrollView style={{ maxHeight: 760 }}>
      {rankedComplexes.map((complex, index) => <View key={complex.id} style={{ ...styles.moduleButton, marginBottom: 16, padding: 20 } as any}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{index + 1}. {complex.name}</Text>
            <Text style={styles.moduleText}>{complex.address || 'Dirección no registrada'}</Text>
          </View>
          <SportsPill text={complex.distance == null ? 'Sin distancia' : `${complex.distance.toFixed(complex.distance < 10 ? 1 : 0)} km`} tone={index === 0 && complex.distance != null ? 'green' : 'blue'} />
        </View>

        <DashboardCards styles={styles} items={[
          { label: 'Campos', value: complex.complexCourts.length, description: 'Registrados' },
          { label: 'Capacidad total', value: complex.totalCapacity, description: 'Suma referencial' },
          { label: 'Mayor campo', value: complex.maxCourtCapacity || '-', description: 'Jugadores' },
          { label: 'Deportes', value: complex.sports.length || '-', description: complex.sports.join(', ') || 'Sin detalle' },
        ]} />

        {complex.complexCourts.map((court: any) => <View key={court.id} style={{ backgroundColor: '#10243a', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#2b4967' }}>
          <Text style={styles.cardTitle}>{court.name}</Text>
          <Text style={styles.moduleText}>{court.sport} · Capacidad: {court.capacity} · S/ {court.price_per_hour || 0} por hora</Text>
        </View>)}
        {!complex.complexCourts.length && <Text style={styles.muted}>Este complejo todavía no tiene campos activos registrados.</Text>}

        <ComplexLocationCard styles={styles} complex={complex} title="Ubicación del complejo" compact />
        <TouchableOpacity style={styles.primaryButton} onPress={() => openDirections(complex)}><Text style={styles.buttonText}>Cómo llegar desde mi ubicación</Text></TouchableOpacity>
      </View>)}
    </ScrollView>

    {!rankedComplexes.length && <Text style={styles.muted}>No hay complejos deportivos activos registrados.</Text>}
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
