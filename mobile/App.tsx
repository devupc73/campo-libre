import React, { useState } from 'react';
import { SafeAreaView, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';

type Screen = 'home' | 'login' | 'register' | 'dashboard' | 'admin' | 'courts' | 'reservations' | 'matches' | 'wallet';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const styles = {
  page: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 640, backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  title: { fontSize: 32, fontWeight: 'bold' as const, color: '#ffffff', marginBottom: 10, textAlign: 'center' as const },
  subtitle: { fontSize: 16, color: '#cbd5e1', textAlign: 'center' as const, marginBottom: 20 },
  input: { backgroundColor: '#020617', borderColor: '#334155', borderWidth: 1, color: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 12 },
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 8 },
  secondaryButton: { backgroundColor: '#334155', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 10 },
  moduleButton: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#334155' },
  buttonText: { color: '#ffffff', fontWeight: 'bold' as const, fontSize: 16, textAlign: 'center' as const },
  moduleTitle: { color: '#ffffff', fontWeight: 'bold' as const, fontSize: 17 },
  moduleText: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  muted: { color: '#94a3b8', fontSize: 14, textAlign: 'center' as const, marginTop: 14 },
  status: { color: '#fde68a', fontSize: 14, textAlign: 'center' as const, marginTop: 14 },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtSport, setCourtSport] = useState('futbol');
  const [courtCapacity, setCourtCapacity] = useState('14');
  const [courtPrice, setCourtPrice] = useState('120');

  async function checkBackend() { setMessage('Validando conexion con backend...'); try { const r = await fetch(`${API_URL}/health`); const d = await r.json(); setMessage(`Backend OK: ${d.status || 'ok'}`); } catch { setMessage('No se pudo conectar con el backend. Revisa URL del API o CORS.'); } }

  async function register() { setMessage('Registrando usuario...'); try { const r = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, email, phone: '', role: 'player', password }) }); if (!r.ok) throw new Error('register_failed'); setMessage('Usuario registrado. Ahora inicia sesion.'); setScreen('login'); } catch { setMessage('Error en registro. Verifica datos o backend.'); } }

  async function login() { setMessage('Iniciando sesion...'); try { const r = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!r.ok) throw new Error('login_failed'); const d = await r.json(); setToken(d.access_token); setResult(''); setScreen('dashboard'); } catch { setMessage('No se pudo iniciar sesion. Verifica usuario y password.'); } }

  async function loadCourts() { setResult('Consultando campos...'); try { const r = await fetch(`${API_URL}/courts`); const d = await r.json(); if (!Array.isArray(d) || d.length === 0) { setResult('No hay campos registrados. Ingresa al modulo Administrador para crear uno.'); return; } setResult(d.map((c: any) => `${c.name} - ${c.sport} - capacidad ${c.capacity} - S/ ${c.price_per_hour}`).join('\n')); } catch { setResult('No se pudo consultar campos.'); } }

  async function loadCount(path: string, label: string) { setResult(`Consultando ${label}...`); try { const r = await fetch(`${API_URL}${path}`); const d = await r.json(); setResult(`${label}: ${Array.isArray(d) ? d.length : 0} registros encontrados.`); } catch { setResult(`No se pudo consultar ${label}.`); } }

  async function createCourt() { setResult('Creando campo deportivo...'); try { const payload = { name: courtName, sport: courtSport, capacity: Number(courtCapacity), price_per_hour: Number(courtPrice) }; const r = await fetch(`${API_URL}/courts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!r.ok) throw new Error('court_failed'); const d = await r.json(); setResult(`Campo creado: ${d.name}`); setCourtName(''); } catch { setResult('No se pudo crear el campo. Verifica datos, backend o CORS para POST /courts.'); } }

  const Back = () => <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('dashboard')}><Text style={styles.buttonText}>Volver al panel</Text></TouchableOpacity>;
  let content = null;

  if (screen === 'home') content = <View style={styles.card}><Text style={styles.title}>Campo Libre</Text><Text style={styles.subtitle}>Reserva campos deportivos, convoca jugadores, registra pagos y arma equipos.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Iniciar sesion</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Crear cuenta</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={checkBackend}><Text style={styles.buttonText}>Probar backend</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}<Text style={styles.muted}>API configurada: {API_URL}</Text></View>;

  if (screen === 'login') content = <View style={styles.card}><Text style={styles.title}>Login</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;

  if (screen === 'register') content = <View style={styles.card}><Text style={styles.title}>Crear cuenta</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={register}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;

  if (screen === 'dashboard') content = <View style={styles.card}><Text style={styles.title}>Panel Campo Libre</Text><Text style={styles.subtitle}>Selecciona una opcion para continuar.</Text><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('admin')}><Text style={styles.moduleTitle}>Administrador</Text><Text style={styles.moduleText}>Crea campos deportivos para que los usuarios puedan reservar.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('courts')}><Text style={styles.moduleTitle}>Buscar campos</Text><Text style={styles.moduleText}>Consulta campos disponibles para reservar.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('reservations')}><Text style={styles.moduleTitle}>Mis reservas</Text><Text style={styles.moduleText}>Revisa reservas y estados.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('matches')}><Text style={styles.moduleTitle}>Convocatorias y sorteo</Text><Text style={styles.moduleText}>Organiza jugadores y equipos.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('wallet')}><Text style={styles.moduleTitle}>Pagos y billetera</Text><Text style={styles.moduleText}>Controla pagos y recaudacion.</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Cerrar sesion</Text></TouchableOpacity><Text style={styles.muted}>Token activo: {token ? `${token.substring(0, 18)}...` : 'sin token'}</Text></View>;

  if (screen === 'admin') content = <View style={styles.card}><Text style={styles.title}>Administrador</Text><Text style={styles.subtitle}>Crear campo deportivo</Text><TextInput style={styles.input} placeholder="Nombre del campo" placeholderTextColor="#64748b" value={courtName} onChangeText={setCourtName} /><TextInput style={styles.input} placeholder="Deporte" placeholderTextColor="#64748b" value={courtSport} onChangeText={setCourtSport} /><TextInput style={styles.input} placeholder="Capacidad" placeholderTextColor="#64748b" value={courtCapacity} onChangeText={setCourtCapacity} keyboardType="numeric" /><TextInput style={styles.input} placeholder="Precio por hora" placeholderTextColor="#64748b" value={courtPrice} onChangeText={setCourtPrice} keyboardType="numeric" /><TouchableOpacity style={styles.primaryButton} onPress={createCourt}><Text style={styles.buttonText}>Crear campo</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;

  if (screen === 'courts') content = <View style={styles.card}><Text style={styles.title}>Buscar campos</Text><Text style={styles.subtitle}>Consulta los campos deportivos registrados.</Text><TouchableOpacity style={styles.primaryButton} onPress={loadCourts}><Text style={styles.buttonText}>Consultar campos</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;

  if (screen === 'reservations') content = <View style={styles.card}><Text style={styles.title}>Mis reservas</Text><Text style={styles.subtitle}>Consulta las reservas creadas en el sistema.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => loadCount('/reservations', 'Reservas')}><Text style={styles.buttonText}>Consultar reservas</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;

  if (screen === 'matches') content = <View style={styles.card}><Text style={styles.title}>Convocatorias</Text><Text style={styles.subtitle}>Aqui construiremos participantes, titulares, suplentes y sorteo de equipos.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setResult('Motor de sorteo pendiente de conectar a pantalla dedicada.')}><Text style={styles.buttonText}>Preparar sorteo</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;

  if (screen === 'wallet') content = <View style={styles.card}><Text style={styles.title}>Pagos y billetera</Text><Text style={styles.subtitle}>Aqui se controlaran pagos, saldos y recaudacion.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setResult('Modulo de pagos listo para integracion con Yape, Plin o transferencia.')}><Text style={styles.buttonText}>Ver estado de pagos</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
