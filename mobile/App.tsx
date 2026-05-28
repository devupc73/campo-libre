import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AvailabilitySlots from './AvailabilitySlots';

type Role = 'admin' | 'player' | '';
type Screen = 'home' | 'login' | 'register' | 'adminHome' | 'playerHome' | 'adminConfig' | 'courts' | 'reservations' | 'matches' | 'wallet';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const styles = {
  page: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 760, backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  title: { fontSize: 30, fontWeight: 'bold' as const, color: '#fff', marginBottom: 10, textAlign: 'center' as const },
  subtitle: { fontSize: 16, color: '#cbd5e1', textAlign: 'center' as const, marginBottom: 16, marginTop: 12 },
  input: { backgroundColor: '#020617', borderColor: '#334155', borderWidth: 1, color: '#fff', padding: 14, borderRadius: 10, marginBottom: 12 },
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 8 },
  secondaryButton: { backgroundColor: '#334155', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 10 },
  moduleButton: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#334155' },
  buttonText: { color: '#fff', fontWeight: 'bold' as const, fontSize: 16, textAlign: 'center' as const },
  moduleTitle: { color: '#fff', fontWeight: 'bold' as const, fontSize: 17 },
  moduleText: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  muted: { color: '#94a3b8', fontSize: 14, textAlign: 'center' as const, marginTop: 14 },
  status: { color: '#fde68a', fontSize: 14, textAlign: 'center' as const, marginTop: 14 },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [role, setRole] = useState<Role>('player');
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [complexId, setComplexId] = useState('');
  const [complexName, setComplexName] = useState('');
  const [complexAddress, setComplexAddress] = useState('');
  const [complexLat, setComplexLat] = useState('-12.0464');
  const [complexLng, setComplexLng] = useState('-77.0428');
  const [courtId, setCourtId] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtSport, setCourtSport] = useState('futbol');
  const [courtCapacity, setCourtCapacity] = useState('14');
  const [courtPrice, setCourtPrice] = useState('120');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('18:00:00');
  const [endTime, setEndTime] = useState('23:00:00');
  const [schedulePrice, setSchedulePrice] = useState('150');

  async function register() {
    setResult('Registrando usuario...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, email, phone: '', role, password }) });
      if (!response.ok) throw new Error();
      setResult('Usuario registrado. Ahora inicia sesion.');
      setScreen('login');
    } catch { setResult('No se pudo registrar.'); }
  }

  async function login() {
    setResult('Iniciando sesion...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setRole(data.role);
      setUserId(String(data.user_id));
      setUserName(data.full_name);
      setResult('');
      setScreen(data.role === 'admin' ? 'adminHome' : 'playerHome');
    } catch { setResult('No se pudo iniciar sesion.'); }
  }

  async function listComplexes() {
    setResult('Consultando complejos...');
    try {
      const response = await fetch(`${API_URL}/sports-complexes`);
      const data = await response.json();
      setResult(Array.isArray(data) && data.length ? data.map((x: any) => `ID ${x.id}: ${x.name} - ${x.address}`).join('\n') : 'No hay complejos registrados.');
    } catch { setResult('No se pudo consultar complejos.'); }
  }

  async function saveComplex(update = false) {
    setResult(update ? 'Actualizando complejo...' : 'Creando complejo...');
    try {
      const response = await fetch(`${API_URL}/sports-complexes${update ? `/${complexId}` : ''}`, { method: update ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: complexName, address: complexAddress, latitude: Number(complexLat), longitude: Number(complexLng) }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setComplexId(String(data.id));
      setResult(`Complejo guardado: ${data.name}. ID ${data.id}`);
    } catch { setResult('No se pudo guardar el complejo.'); }
  }

  async function listCourts() {
    setResult('Consultando campos...');
    try {
      const url = complexId ? `${API_URL}/courts/?complex_id=${complexId}` : `${API_URL}/courts/`;
      const response = await fetch(url);
      const data = await response.json();
      setResult(Array.isArray(data) && data.length ? data.map((c: any) => `ID ${c.id}: ${c.name} - ${c.sport} - S/ ${c.price_per_hour} - complejo ${c.complex_id || 'N/A'}`).join('\n') : 'No hay campos para el filtro.');
    } catch { setResult('No se pudo consultar campos.'); }
  }

  async function saveCourt(update = false) {
    setResult(update ? 'Actualizando campo...' : 'Creando campo...');
    try {
      const payload = { complex_id: complexId ? Number(complexId) : null, name: courtName, sport: courtSport, capacity: Number(courtCapacity), price_per_hour: Number(courtPrice) };
      const response = await fetch(`${API_URL}/courts/${update ? courtId : ''}`, { method: update ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCourtId(String(data.id));
      setResult(`Campo guardado: ${data.name}. ID ${data.id}`);
    } catch { setResult('No se pudo guardar el campo.'); }
  }

  async function createSchedule() {
    setResult('Creando horario con tarifa...');
    try {
      const payload = { court_id: Number(courtId), day_of_week: Number(dayOfWeek), start_time: startTime, end_time: endTime, price_per_hour: Number(schedulePrice) };
      const response = await fetch(`${API_URL}/court-schedules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      setResult('Horario con tarifa creado correctamente.');
    } catch { setResult('No se pudo crear el horario.'); }
  }

  function logout() { setResult(''); setUserId('1'); setUserName(''); setScreen('home'); }
  const Back = () => <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen(role === 'admin' ? 'adminHome' : 'playerHome')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>;

  let content = null;
  if (screen === 'home') content = <View style={styles.card}><Text style={styles.title}>Campo Libre</Text><Text style={styles.subtitle}>Reserva campos deportivos y organiza partidos.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Iniciar sesion</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Crear cuenta</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Text style={styles.muted}>API: {API_URL}</Text></View>;
  if (screen === 'login') content = <View style={styles.card}><Text style={styles.title}>Login</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity><Back />{!!result && <Text style={styles.status}>{result}</Text>}</View>;
  if (screen === 'register') content = <View style={styles.card}><Text style={styles.title}>Crear cuenta</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={role === 'player' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('player')}><Text style={styles.buttonText}>Jugador</Text></TouchableOpacity><TouchableOpacity style={role === 'admin' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('admin')}><Text style={styles.buttonText}>Administrador</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={register}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity><Back />{!!result && <Text style={styles.status}>{result}</Text>}</View>;
  if (screen === 'adminHome') content = <View style={styles.card}><Text style={styles.title}>Ambiente Administrador</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('adminConfig')}><Text style={styles.moduleTitle}>Gestionar complejos, campos y tarifas</Text><Text style={styles.moduleText}>Configura oferta, horarios y precios.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('reservations')}><Text style={styles.moduleTitle}>Reservas registradas</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesion</Text></TouchableOpacity></View>;
  if (screen === 'playerHome') content = <View style={styles.card}><Text style={styles.title}>Ambiente Jugador</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('courts')}><Text style={styles.moduleTitle}>Buscar y reservar campos</Text><Text style={styles.moduleText}>Consulta slots visuales y reserva.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('reservations')}><Text style={styles.moduleTitle}>Mis reservas</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesion</Text></TouchableOpacity></View>;
  if (screen === 'adminConfig') content = <View style={styles.card}><Text style={styles.title}>Administrador</Text><Text style={styles.subtitle}>Complejo deportivo</Text><TextInput style={styles.input} placeholder="ID para actualizar" placeholderTextColor="#64748b" value={complexId} onChangeText={setComplexId} /><TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#64748b" value={complexName} onChangeText={setComplexName} /><TextInput style={styles.input} placeholder="Direccion" placeholderTextColor="#64748b" value={complexAddress} onChangeText={setComplexAddress} /><TextInput style={styles.input} placeholder="Latitud" placeholderTextColor="#64748b" value={complexLat} onChangeText={setComplexLat} /><TextInput style={styles.input} placeholder="Longitud" placeholderTextColor="#64748b" value={complexLng} onChangeText={setComplexLng} /><TouchableOpacity style={styles.primaryButton} onPress={() => saveComplex(false)}><Text style={styles.buttonText}>Crear complejo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => saveComplex(true)}><Text style={styles.buttonText}>Actualizar complejo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={listComplexes}><Text style={styles.buttonText}>Listar complejos</Text></TouchableOpacity><Text style={styles.subtitle}>Campo</Text><TextInput style={styles.input} placeholder="ID campo" placeholderTextColor="#64748b" value={courtId} onChangeText={setCourtId} /><TextInput style={styles.input} placeholder="ID complejo" placeholderTextColor="#64748b" value={complexId} onChangeText={setComplexId} /><TextInput style={styles.input} placeholder="Nombre campo" placeholderTextColor="#64748b" value={courtName} onChangeText={setCourtName} /><TextInput style={styles.input} placeholder="Deporte" placeholderTextColor="#64748b" value={courtSport} onChangeText={setCourtSport} /><TextInput style={styles.input} placeholder="Capacidad" placeholderTextColor="#64748b" value={courtCapacity} onChangeText={setCourtCapacity} /><TextInput style={styles.input} placeholder="Precio base" placeholderTextColor="#64748b" value={courtPrice} onChangeText={setCourtPrice} /><TouchableOpacity style={styles.primaryButton} onPress={() => saveCourt(false)}><Text style={styles.buttonText}>Crear campo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => saveCourt(true)}><Text style={styles.buttonText}>Actualizar campo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={listCourts}><Text style={styles.buttonText}>Listar campos</Text></TouchableOpacity><Text style={styles.subtitle}>Horario y tarifa</Text><TextInput style={styles.input} placeholder="ID campo" placeholderTextColor="#64748b" value={courtId} onChangeText={setCourtId} /><TextInput style={styles.input} placeholder="Dia 1-7" placeholderTextColor="#64748b" value={dayOfWeek} onChangeText={setDayOfWeek} /><TextInput style={styles.input} placeholder="Inicio HH:MM:SS" placeholderTextColor="#64748b" value={startTime} onChangeText={setStartTime} /><TextInput style={styles.input} placeholder="Fin HH:MM:SS" placeholderTextColor="#64748b" value={endTime} onChangeText={setEndTime} /><TextInput style={styles.input} placeholder="Precio por hora" placeholderTextColor="#64748b" value={schedulePrice} onChangeText={setSchedulePrice} /><TouchableOpacity style={styles.primaryButton} onPress={createSchedule}><Text style={styles.buttonText}>Crear horario con tarifa</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'courts') content = <View style={styles.card}><Text style={styles.title}>Buscar y reservar</Text><TouchableOpacity style={styles.secondaryButton} onPress={listComplexes}><Text style={styles.buttonText}>Listar complejos</Text></TouchableOpacity><TextInput style={styles.input} placeholder="ID complejo opcional" placeholderTextColor="#64748b" value={complexId} onChangeText={setComplexId} /><TouchableOpacity style={styles.secondaryButton} onPress={listCourts}><Text style={styles.buttonText}>Consultar campos</Text></TouchableOpacity><AvailabilitySlots userId={userId} styles={styles} />{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'reservations') content = <View style={styles.card}><Text style={styles.title}>Reservas</Text><TouchableOpacity style={styles.primaryButton} onPress={async () => { const r = await fetch(`${API_URL}/reservations/`); const d = await r.json(); setResult(Array.isArray(d) ? d.map((x: any) => `ID ${x.id}: cancha ${x.court_id} - S/ ${x.total_price} - ${x.status}`).join('\n') : 'Sin reservas'); }}><Text style={styles.buttonText}>Consultar reservas</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'matches') content = <View style={styles.card}><Text style={styles.title}>Convocatorias</Text><Text style={styles.subtitle}>Pendiente de implementar.</Text><Back /></View>;
  if (screen === 'wallet') content = <View style={styles.card}><Text style={styles.title}>Pagos</Text><Text style={styles.subtitle}>Pendiente de implementar.</Text><Back /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
