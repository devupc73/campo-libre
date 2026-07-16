import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

function hasValidCoordinates(item: any) {
  return Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));
}

export default function CaptainNearbyComplexes({ styles }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [locationStatus, setLocationStatus] = useState('Selecciona tu ubicación actual o ingresa una posición referencial.');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setMessage('');

    try {
      const complexResponse = await fetch(`${API_URL}/sports-complexes`);
      if (!complexResponse.ok) throw new Error(await responseError(complexResponse));
      const complexData = await complexResponse.json();
      const activeComplexes = Array.isArray(complexData)
        ? complexData.filter((item) => String(item?.status || 'active').toLowerCase() !== 'inactive')
        : [];
      setComplexes(activeComplexes);

      try {
        const courtResponse = await fetch(`${API_URL}/courts/`);
        if (!courtResponse.ok) throw new Error(await responseError(courtResponse));
        const courtData = await courtResponse.json();
        setCourts(Array.isArray(courtData)
          ? courtData.filter((item) => String(item?.status || 'available').toLowerCase() !== 'inactive')
          : []);
      } catch (courtError: any) {
        setCourts([]);
        setMessage(`Se cargaron ${activeComplexes.length} complejos, pero no fue posible calcular el precio promedio. ${courtError.message || ''}`.trim());
      }

      if (!activeComplexes.length) {
        setMessage('El API respondió correctamente, pero no existen complejos deportivos activos registrados.');
      }
    } catch (error: any) {
      setComplexes([]);
      setCourts([]);
      setMessage(error.message || 'No se pudieron cargar los complejos deportivos.');
    } finally {
      setLoading(false);
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
        const current = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        setPosition(current);
        setManualLatitude(String(current.latitude.toFixed(6)));
        setManualLongitude(String(current.longitude.toFixed(6)));
        setLocationStatus('Lista ordenada desde tu posición actual.');
      },
      (error) => {
        setLocationStatus(error.code === 1
          ? 'Permiso de ubicación denegado. Puedes ingresar una posición referencial manual.'
          : 'No fue posible obtener tu ubicación actual. Ingresa una posición referencial manual.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }

  function applyManualPosition() {
    const latitude = Number(manualLatitude.replace(',', '.'));
    const longitude = Number(manualLongitude.replace(',', '.'));

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setLocationStatus('Ingresa una latitud válida entre -90 y 90.');
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setLocationStatus('Ingresa una longitud válida entre -180 y 180.');
      return;
    }

    setPosition({ latitude, longitude });
    setLocationStatus('Lista ordenada desde la posición referencial ingresada.');
  }

  const rankedComplexes = useMemo(() => complexes.map((complex) => {
    const complexCourts = courts.filter((court) => Number(court.complex_id) === Number(complex.id));
    const prices = complexCourts
      .map((court) => Number(court.price_per_hour))
      .filter((price) => Number.isFinite(price) && price >= 0);
    const averagePrice = prices.length
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : null;
    const distance = position && hasValidCoordinates(complex)
      ? distanceKm(position, { latitude: Number(complex.latitude), longitude: Number(complex.longitude) })
      : null;

    return { ...complex, distance, averagePrice };
  }).sort((a, b) => {
    if (a.distance == null && b.distance == null) return String(a.name).localeCompare(String(b.name));
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  }), [complexes, courts, position]);

  function openMap(complex: any) {
    const query = hasValidCoordinates(complex)
      ? `${complex.latitude},${complex.longitude}`
      : complex.address || complex.name;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  return <View>
    <SportsSectionTitle title="Complejos cercanos" subtitle="Compara distancia y precio promedio por hora." icon="📍" />

    <View style={{ backgroundColor: '#10243a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2b4967', marginBottom: 14 }}>
      <Text style={styles.cardTitle}>Posición referencial</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}>
        <Text style={styles.buttonText}>Usar mi ubicación actual</Text>
      </TouchableOpacity>
      <Text style={styles.muted}>También puedes ingresar coordenadas manualmente.</Text>
      <TextInput
        style={styles.input}
        placeholder="Latitud, por ejemplo -12.046374"
        placeholderTextColor="#718198"
        keyboardType="numeric"
        value={manualLatitude}
        onChangeText={setManualLatitude}
      />
      <TextInput
        style={styles.input}
        placeholder="Longitud, por ejemplo -77.042793"
        placeholderTextColor="#718198"
        keyboardType="numeric"
        value={manualLongitude}
        onChangeText={setManualLongitude}
      />
      <TouchableOpacity style={styles.secondaryButton} onPress={applyManualPosition}>
        <Text style={styles.buttonText}>Usar posición ingresada</Text>
      </TouchableOpacity>
      <Text style={styles.status}>{locationStatus}</Text>
    </View>

    <TouchableOpacity style={styles.secondaryButton} onPress={loadData}>
      <Text style={styles.buttonText}>{loading ? 'Cargando complejos...' : 'Actualizar complejos'}</Text>
    </TouchableOpacity>
    <Text style={styles.muted}>{loading ? 'Consultando complejos registrados...' : `${rankedComplexes.length} complejo(s) disponible(s)`}</Text>

    <ScrollView style={{ maxHeight: 760 }}>
      {rankedComplexes.map((complex, index) => <View key={complex.id} style={{ ...styles.moduleButton, marginBottom: 14, padding: 18 } as any}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{index + 1}. {complex.name}</Text>
            <Text style={styles.moduleText}>{complex.address || 'Dirección no registrada'}</Text>
          </View>
          <SportsPill
            text={complex.distance == null ? 'Sin referencia' : `${complex.distance.toFixed(complex.distance < 10 ? 1 : 0)} km`}
            tone={index === 0 && complex.distance != null ? 'green' : 'blue'}
          />
        </View>

        <Text style={styles.moduleText}>
          Precio promedio por hora: {complex.averagePrice == null ? 'No disponible' : `S/ ${complex.averagePrice.toFixed(2)}`}
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => openMap(complex)}>
          <Text style={styles.buttonText}>Ver ubicación en Google Maps</Text>
        </TouchableOpacity>
      </View>)}
    </ScrollView>

    {!loading && !rankedComplexes.length && <Text style={styles.muted}>No hay complejos deportivos activos registrados.</Text>}
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
