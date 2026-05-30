import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AvailabilitySlots from './AvailabilitySlots';
import CaptainDashboard from './CaptainDashboard';
import ComplexOperations from './ComplexOperations';
import DashboardCards from './DashboardCards';
import MatchWallet from './MatchWallet';

type Role = 'system_admin' | 'complex_admin' | 'captain' | 'player';
type Screen = 'home' | 'login' | 'register' | 'systemHome' | 'complexHome' | 'captainHome' | 'playerHome' | 'systemComplexes' | 'complexOps' | 'playerBooking' | 'reservations' | 'wallet';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const styles = {
  page: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 860, backgroundColor: '#111827', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
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
  const [complexName, setComplexName] = useState('Complejo Deportivo');
  const [complexAddress, setComplexAddress] = useState('Lima');
  const [complexLat, setComplexLat] = useState('-12.0464');
  const [complexLng, setComplexLng] = useState('-77.0428');
  const [complexAdminId, setComplexAdminId] = useState('');

  function homeFor(userRole: string): Screen {
    if (userRole === 'system_admin') return 'systemHome';
    if (userRole === 'complex_admin') return 'complexHome';
    if (userRole === 'captain') return 'captainHome';
    return 'playerHome';
  }

  async function register() {
    setResult('Registrando usuario...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: '', role, password }),
      });
      if (!response.ok) throw new Error();
      setResult(`Usuario registrado como ${role}. Ahora inicia sesión.`);
      setScreen('login');
    } catch { setResult('No se pudo registrar.'); }
  }

  async function login() {
    setResult('Iniciando sesión...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setRole(data.role);
      setUserId(String(data.user_id));
      setUserName(data.full_name);
      setResult('');
      setScreen(homeFor(data.role));
    } catch { setResult('No se pudo iniciar sesión.'); }
  }

  async function saveComplex() {
    setResult('Creando complejo y asignando administrador...');
    try {
      const payload = { name: complexName, address: complexAddress, latitude: Number(complexLat), longitude: Number(complexLng), system_admin_user_id: Number(userId), complex_admin_user_id: complexAdminId ? Number(complexAdminId) : null, description: '', phone: '', image_url: '', rating: 0 };
      const response = await fetch(`${API_URL}/sports-complexes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setComplexId(String(data.id));
      setResult(`Complejo creado. ID ${data.id}. Admin complejo: ${data.complex_admin_user_id || 'pendiente'}`);
    } catch { setResult('No se pudo crear el complejo.'); }
  }

  async function listReservations() {
    setResult('Consultando reservas...');
    try {
      const response = await fetch(`${API_URL}/reservations/`);
      const data = await response.json();
      setResult(Array.isArray(data) && data.length ? data.map((x: any) => `ID ${x.id}: cancha ${x.court_id} - S/ ${x.total_price} - ${x.status}`).join('\n') : 'Sin reservas');
    } catch { setResult('No se pudo consultar reservas.'); }
  }

  function logout() { setResult(''); setUserId('1'); setUserName(''); setScreen('home'); }
  const Back = () => <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen(homeFor(role))}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>;

  let content = null;

  if (screen === 'home') content = <View style={styles.card}><Text style={styles.title}>Campo Libre</Text><Text style={styles.subtitle}>Marketplace deportivo con roles separados.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Iniciar sesión</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Crear cuenta</Text></TouchableOpacity><Text style={styles.muted}>API: {API_URL}</Text></View>;
  if (screen === 'login') content = <View style={styles.card}><Text style={styles.title}>Login</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}</View>;
  if (screen === 'register') content = <View style={styles.card}><Text style={styles.title}>Crear cuenta</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><Text style={styles.subtitle}>Selecciona rol</Text><TouchableOpacity style={role === 'system_admin' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('system_admin')}><Text style={styles.buttonText}>Administrador del sistema</Text></TouchableOpacity><TouchableOpacity style={role === 'complex_admin' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('complex_admin')}><Text style={styles.buttonText}>Administrador del complejo</Text></TouchableOpacity><TouchableOpacity style={role === 'captain' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('captain')}><Text style={styles.buttonText}>Capitán / gestor</Text></TouchableOpacity><TouchableOpacity style={role === 'player' ? styles.primaryButton : styles.secondaryButton} onPress={() => setRole('player')}><Text style={styles.buttonText}>Jugador participante</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={register}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}</View>;
  if (screen === 'systemHome') content = <View style={styles.card}><Text style={styles.title}>Administrador del sistema</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><DashboardCards styles={styles} items={[{ label: 'Rol', value: 'Sistema', description: 'Crea complejos y asigna administradores' }, { label: 'Usuario', value: userId, description: 'ID administrador sistema' }]} /><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('systemComplexes')}><Text style={styles.moduleTitle}>Crear complejo y asignar administrador</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'complexHome') content = <View style={styles.card}><Text style={styles.title}>Administrador del complejo</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><DashboardCards styles={styles} items={[{ label: 'Rol', value: 'Complejo', description: 'Gestiona operación diaria' }, { label: 'Usuario', value: userId, description: 'ID administrador complejo' }]} /><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('complexOps')}><Text style={styles.moduleTitle}>Campos y disponibilidad</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('reservations')}><Text style={styles.moduleTitle}>Reservas y pagos</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'captainHome') content = <View style={styles.card}><CaptainDashboard styles={styles} userId={userId} onBack={() => setScreen('captainHome')} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'playerHome') content = <View style={styles.card}><Text style={styles.title}>Jugador participante</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><Text style={styles.moduleText}>Este perfil participa en partidos creados por un capitán. No crea reservas ni gestiona la bolsa.</Text><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'systemComplexes') content = <View style={styles.card}><Text style={styles.title}>Crear complejo</Text><TextInput style={styles.input} placeholder="Nombre complejo" placeholderTextColor="#64748b" value={complexName} onChangeText={setComplexName} /><TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="#64748b" value={complexAddress} onChangeText={setComplexAddress} /><TextInput style={styles.input} placeholder="Latitud" placeholderTextColor="#64748b" value={complexLat} onChangeText={setComplexLat} /><TextInput style={styles.input} placeholder="Longitud" placeholderTextColor="#64748b" value={complexLng} onChangeText={setComplexLng} /><TextInput style={styles.input} placeholder="ID administrador del complejo" placeholderTextColor="#64748b" value={complexAdminId} onChangeText={setComplexAdminId} /><TouchableOpacity style={styles.primaryButton} onPress={saveComplex}><Text style={styles.buttonText}>Crear complejo</Text></TouchableOpacity>{!!complexId && <Text style={styles.status}>Complejo creado: {complexId}</Text>}{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'complexOps') content = <View style={styles.card}><ComplexOperations styles={styles} /><Back /></View>;
  if (screen === 'playerBooking') content = <View style={styles.card}><Text style={styles.title}>Buscar y reservar</Text><AvailabilitySlots userId={userId} styles={styles} /><Back /></View>;
  if (screen === 'reservations') content = <View style={styles.card}><Text style={styles.title}>Reservas</Text><TouchableOpacity style={styles.primaryButton} onPress={listReservations}><Text style={styles.buttonText}>Consultar reservas</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'wallet') content = <View style={styles.card}><MatchWallet styles={styles} userId={userId} /><Back /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
