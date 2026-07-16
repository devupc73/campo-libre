import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SportsPill, SportsSectionTitle } from './SportsBrand';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
type Coordinates = { latitude: number; longitude: number };

function toRadians(value: number) { return (value * Math.PI) / 180; }
function distanceKm(origin: Coordinates, destination: Coordinates) {
  const radius = 6371;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLng = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function responseError(response: Response) {
  try { const data = await response.json(); return data.detail || data.message || `Error HTTP ${response.status}`; }
  catch { return `Error HTTP ${response.status}`; }
}
function hasValidCoordinates(item: any) {
  return Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));
}
function buildMapDocument(position: Coordinates, rankedComplexes: any[]) {
  const points = rankedComplexes.map((complex, index) => ({
    number: index + 1,
    name: String(complex.name || `Complejo ${index + 1}`),
    address: String(complex.address || 'Dirección no registrada'),
    latitude: Number(complex.latitude), longitude: Number(complex.longitude),
    distance: complex.distance == null ? null : Number(complex.distance),
  })).filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  const safePoints = JSON.stringify(points).replace(/</g, '\\u003c');
  const safePosition = JSON.stringify(position).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}.marker{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font:800 15px Arial;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.45)}.number{background:#16a34a}.reference{background:#2563eb}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const position=${safePosition};const points=${safePoints};const map=L.map('map').setView([position.latitude,position.longitude],13);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);const bounds=[[position.latitude,position.longitude]];const ref=L.divIcon({className:'',html:'<div class="marker reference">R</div>',iconSize:[32,32],iconAnchor:[16,16]});L.marker([position.latitude,position.longitude],{icon:ref}).addTo(map).bindPopup('<strong>Posición referencial</strong>');points.forEach(p=>{const icon=L.divIcon({className:'',html:'<div class="marker number">'+p.number+'</div>',iconSize:[32,32],iconAnchor:[16,16]});const d=p.distance==null?'Sin distancia':p.distance.toFixed(p.distance<10?1:0)+' km';L.marker([p.latitude,p.longitude],{icon}).addTo(map).bindPopup('<strong>'+p.number+'. '+p.name+'</strong><br>'+p.address+'<br>'+d);bounds.push([p.latitude,p.longitude]);});if(bounds.length>1)map.fitBounds(bounds,{padding:[38,38],maxZoom:15});</script></body></html>`;
}

export default function CaptainNearbyComplexes({ styles }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [locationStatus, setLocationStatus] = useState('Usa tu ubicación actual o ingresa una dirección referencial.');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    setLoading(true); setMessage('');
    try {
      const complexResponse = await fetch(`${API_URL}/sports-complexes`);
      if (!complexResponse.ok) throw new Error(await responseError(complexResponse));
      const complexData = await complexResponse.json();
      setComplexes(Array.isArray(complexData) ? complexData : []);
      try {
        const courtResponse = await fetch(`${API_URL}/courts/`);
        if (!courtResponse.ok) throw new Error(await responseError(courtResponse));
        const courtData = await courtResponse.json();
        setCourts(Array.isArray(courtData) ? courtData.filter((item) => String(item?.status || 'available').toLowerCase() !== 'inactive') : []);
      } catch (error: any) { setCourts([]); setMessage(`Complejos cargados, pero no fue posible calcular precios. ${error.message || ''}`.trim()); }
    } catch (error: any) { setComplexes([]); setCourts([]); setMessage(error.message || 'No se pudieron cargar los complejos.'); }
    finally { setLoading(false); }
  }
  function useCoordinates(coordinates: Coordinates, status: string) {
    setPosition(coordinates);
    setManualLatitude(coordinates.latitude.toFixed(6));
    setManualLongitude(coordinates.longitude.toFixed(6));
    setLocationStatus(status);
  }
  function requestLocation() {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('La ubicación automática está disponible en la versión web.'); return;
    }
    setLocationStatus('Obteniendo tu posición actual...');
    navigator.geolocation.getCurrentPosition(
      (result) => useCoordinates({ latitude: result.coords.latitude, longitude: result.coords.longitude }, 'Mapa y lista ordenados desde tu posición actual.'),
      () => setLocationStatus('No fue posible obtener tu ubicación. Ingresa una dirección o coordenadas.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }
  async function geocodeAddress() {
    const address = manualAddress.trim();
    if (address.length < 5) { setLocationStatus('Ingresa una dirección más específica.'); return; }
    setGeocoding(true); setLocationStatus('Buscando la dirección...');
    try {
      const response = await fetch(`${API_URL}/sports-complexes/geocode?address=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      useCoordinates({ latitude: Number(data.latitude), longitude: Number(data.longitude) }, `Dirección encontrada: ${data.display_name || address}`);
    } catch (error: any) { setLocationStatus(error.message || 'No fue posible encontrar la dirección.'); }
    finally { setGeocoding(false); }
  }
  function applyManualPosition() {
    const latitude = Number(manualLatitude.replace(',', '.'));
    const longitude = Number(manualLongitude.replace(',', '.'));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) { setLocationStatus('Ingresa una latitud válida entre -90 y 90.'); return; }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) { setLocationStatus('Ingresa una longitud válida entre -180 y 180.'); return; }
    useCoordinates({ latitude, longitude }, 'Mapa y lista ordenados desde las coordenadas ingresadas.');
  }
  const rankedComplexes = useMemo(() => complexes.map((complex) => {
    const complexCourts = courts.filter((court) => Number(court.complex_id) === Number(complex.id));
    const prices = complexCourts.map((court) => Number(court.price_per_hour)).filter((price) => Number.isFinite(price) && price >= 0);
    const averagePrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
    const distance = position && hasValidCoordinates(complex) ? distanceKm(position, { latitude: Number(complex.latitude), longitude: Number(complex.longitude) }) : null;
    return { ...complex, distance, averagePrice };
  }).sort((a, b) => a.distance == null && b.distance == null ? String(a.name).localeCompare(String(b.name)) : a.distance == null ? 1 : b.distance == null ? -1 : a.distance - b.distance), [complexes, courts, position]);
  const mapDocument = useMemo(() => position ? buildMapDocument(position, rankedComplexes) : '', [position, rankedComplexes]);
  function openMap(complex: any) {
    const query = hasValidCoordinates(complex) ? `${complex.latitude},${complex.longitude}` : complex.address || complex.name;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  return <View>
    <SportsSectionTitle title="Complejos cercanos" subtitle="Compara ubicación, distancia y precio promedio por hora." icon="📍" />
    <View style={{ backgroundColor: '#10243a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2b4967', marginBottom: 14 }}>
      <Text style={styles.cardTitle}>Posición referencial</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}><Text style={styles.buttonText}>Usar mi ubicación actual</Text></TouchableOpacity>
      <Text style={styles.muted}>O escribe una dirección completa.</Text>
      <TextInput style={styles.input} placeholder="Ejemplo: Av. Arequipa 265, Lima, Perú" placeholderTextColor="#718198" value={manualAddress} onChangeText={setManualAddress} onSubmitEditing={geocodeAddress} />
      <TouchableOpacity style={styles.secondaryButton} onPress={geocodeAddress}><Text style={styles.buttonText}>{geocoding ? 'Buscando dirección...' : 'Convertir dirección en coordenadas'}</Text></TouchableOpacity>
      <Text style={styles.muted}>También puedes ingresar coordenadas directamente.</Text>
      <TextInput style={styles.input} placeholder="Latitud" placeholderTextColor="#718198" keyboardType="numeric" value={manualLatitude} onChangeText={setManualLatitude} />
      <TextInput style={styles.input} placeholder="Longitud" placeholderTextColor="#718198" keyboardType="numeric" value={manualLongitude} onChangeText={setManualLongitude} />
      <TouchableOpacity style={styles.secondaryButton} onPress={applyManualPosition}><Text style={styles.buttonText}>Usar coordenadas ingresadas</Text></TouchableOpacity>
      <Text style={styles.status}>{locationStatus}</Text>
    </View>
    {position && Platform.OS === 'web' && mapDocument ? <View style={{ marginBottom: 16, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: '#2b4967', backgroundColor: '#10243a', padding: 10 }}>
      <Text style={styles.cardTitle}>Mapa de complejos cercanos</Text><Text style={styles.moduleText}>R = posición referencial. Los números coinciden con la lista.</Text>
      {React.createElement('iframe', { srcDoc: mapDocument, title: 'Mapa numerado de complejos cercanos', width: '100%', height: '420', style: { border: 0, borderRadius: 12, marginTop: 12 }, loading: 'lazy' })}
    </View> : null}
    <TouchableOpacity style={styles.secondaryButton} onPress={loadData}><Text style={styles.buttonText}>{loading ? 'Cargando complejos...' : 'Actualizar complejos'}</Text></TouchableOpacity>
    <Text style={styles.muted}>{loading ? 'Consultando complejos registrados...' : `${rankedComplexes.length} complejo(s) disponible(s)`}</Text>
    <ScrollView style={{ maxHeight: 760 }}>{rankedComplexes.map((complex, index) => <View key={complex.id} style={{ ...styles.moduleButton, marginBottom: 14, padding: 18 } as any}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{index + 1}. {complex.name}</Text><Text style={styles.moduleText}>{complex.address || 'Dirección no registrada'}</Text></View><SportsPill text={complex.distance == null ? 'Sin referencia' : `${complex.distance.toFixed(complex.distance < 10 ? 1 : 0)} km`} tone={index === 0 && complex.distance != null ? 'green' : 'blue'} /></View>
      <Text style={styles.moduleText}>Precio promedio por hora: {complex.averagePrice == null ? 'No disponible' : `S/ ${complex.averagePrice.toFixed(2)}`}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => openMap(complex)}><Text style={styles.buttonText}>Ver ubicación en Google Maps</Text></TouchableOpacity>
    </View>)}</ScrollView>
    {!loading && !rankedComplexes.length && <Text style={styles.muted}>No hay complejos deportivos activos registrados.</Text>}
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;
}
