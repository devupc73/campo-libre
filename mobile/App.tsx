import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AvailabilitySlots from './AvailabilitySlots';
import CaptainDashboard from './CaptainDashboard';
import ComboSelect from './ComboSelect';
import ComplexOperations from './ComplexOperations';
import DashboardCards from './DashboardCards';
import MatchWallet from './MatchWallet';
import SystemComplexManagement from './SystemComplexManagement';
import UserManagement from './UserManagement';

type Role = 'system_admin' | 'complex_admin' | 'captain' | 'player';
type LoginScope = 'general' | 'system';
type Screen = 'home' | 'generalAccess' | 'systemAccess' | 'login' | 'register' | 'systemRegister' | 'systemHome' | 'complexHome' | 'captainHome' | 'playerHome' | 'systemComplexes' | 'systemUsers' | 'complexOps' | 'playerBooking' | 'reservations' | 'wallet';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const publicRoleOptions = [
  { label: 'Capitán / gestor', value: 'captain' },
  { label: 'Jugador participante', value: 'player' },
];

function initialScreenFromPath(): Screen {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin-system')) return 'systemAccess';
  if (path.includes('general')) return 'generalAccess';
  return 'home';
}

const styles = {
  page: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 900, backgroundColor: '#111827', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
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
  const [screen, setScreen] = useState<Screen>(initialScreenFromPath());
  const [loginScope, setLoginScope] = useState<LoginScope>(initialScreenFromPath() === 'systemAccess' ? 'system' : 'general');
  const [role, setRole] = useState<Role>('player');
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');

  function navigate(nextScreen: Screen, path?: string) {
    setScreen(nextScreen);
    if (typeof window !== 'undefined' && path) {
      window.history.pushState({}, '', path);
    }
  }

  function homeFor(userRole: string): Screen {
    if (userRole === 'system_admin') return 'systemHome';
    if (userRole === 'complex_admin') return 'complexHome';
    if (userRole === 'captain') return 'captainHome';
    return 'playerHome';
  }

  function openLogin(scope: LoginScope) {
    setLoginScope(scope);
    setResult('');
    setScreen('login');
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
      openLogin('general');
    } catch { setResult('No se pudo registrar.'); }
  }

  async function registerSystemAdmin() {
    setResult('Registrando administrador del sistema...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: '', role: 'system_admin', password }),
      });
      if (!response.ok) throw new Error();
      setResult('Administrador del sistema registrado. Ahora inicia sesión.');
      openLogin('system');
    } catch { setResult('No se pudo registrar el administrador del sistema.'); }
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

      if (loginScope === 'general' && data.role === 'system_admin') {
        setResult('Usa la URL /admin-system para ingresar con ese rol.');
        return;
      }
      if (loginScope === 'system' && data.role !== 'system_admin') {
        setResult('Este acceso es exclusivo para el administrador del sistema.');
        return;
      }

      setRole(data.role);
      setUserId(String(data.user_id));
      setUserName(data.full_name);
      setResult('');
      setScreen(homeFor(data.role));
    } catch { setResult('No se pudo iniciar sesión.'); }
  }

  async function listReservations() {
    setResult('Consultando reservas...');
    try {
      const response = await fetch(`${API_URL}/reservations/`);
      const data = await response.json();
      setResult(Array.isArray(data) && data.length ? data.map((x: any) => `ID ${x.id}: cancha ${x.court_id} - S/ ${x.total_price} - ${x.status}`).join('\n') : 'Sin reservas');
    } catch { setResult('No se pudo consultar reservas.'); }
  }

  function logout() { setResult(''); setUserId('1'); setUserName(''); navigate('home', '/'); }
  const Back = () => <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen(homeFor(role))}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>;

  let content = null;

  if (screen === 'home') content = <View style={styles.card}><Text style={styles.title}>Campo Libre</Text><Text style={styles.subtitle}>Usa URLs separadas para cada acceso.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => navigate('generalAccess', '/general')}><Text style={styles.buttonText}>Ir a /general</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => navigate('systemAccess', '/admin-system')}><Text style={styles.buttonText}>Ir a /admin-system</Text></TouchableOpacity><Text style={styles.muted}>API: {API_URL}</Text></View>;

  if (screen === 'generalAccess') content = <View style={styles.card}><Text style={styles.title}>Acceso general</Text><Text style={styles.subtitle}>URL: /general. Ingresan administradores de complejo, capitanes y jugadores. Solo capitanes y jugadores pueden registrarse.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => openLogin('general')}><Text style={styles.buttonText}>Ingresar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Registrarme como capitán o jugador</Text></TouchableOpacity></View>;

  if (screen === 'systemAccess') content = <View style={styles.card}><Text style={styles.title}>Administrador del sistema</Text><Text style={styles.subtitle}>URL: /admin-system. Acceso exclusivo para gestionar plataforma, usuarios y complejos.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => openLogin('system')}><Text style={styles.buttonText}>Ingresar como administrador del sistema</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemRegister')}><Text style={styles.buttonText}>Registrar administrador del sistema</Text></TouchableOpacity></View>;

  if (screen === 'login') content = <View style={styles.card}><Text style={styles.title}>{loginScope === 'system' ? 'Login administrador del sistema' : 'Login acceso general'}</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen(loginScope === 'system' ? 'systemAccess' : 'generalAccess')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}</View>;

  if (screen === 'register') content = <View style={styles.card}><Text style={styles.title}>Registro público</Text><Text style={styles.subtitle}>Solo para capitanes y jugadores.</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><ComboSelect styles={styles} label="Tipo de cuenta" value={role} options={publicRoleOptions} onChange={(value) => setRole(value as Role)} /><Text style={styles.muted}>El administrador del complejo solo puede ser creado y asignado por el administrador del sistema.</Text><TouchableOpacity style={styles.primaryButton} onPress={register}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('generalAccess')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}</View>;

  if (screen === 'systemRegister') content = <View style={styles.card}><Text style={styles.title}>Registro administrador del sistema</Text><Text style={styles.subtitle}>Disponible únicamente desde /admin-system.</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={registerSystemAdmin}><Text style={styles.buttonText}>Registrar administrador del sistema</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemAccess')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}</View>;

  if (screen === 'systemHome') content = <View style={styles.card}><Text style={styles.title}>Administrador del sistema</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><DashboardCards styles={styles} items={[{ label: 'Rol', value: 'Sistema', description: 'Gestiona plataforma' }, { label: 'Usuario', value: userId, description: 'ID administrador sistema' }]} /><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('systemComplexes')}><Text style={styles.moduleTitle}>Gestionar complejos</Text><Text style={styles.moduleText}>Crear, actualizar y asignar administradores.</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('systemUsers')}><Text style={styles.moduleTitle}>Gestionar usuarios</Text><Text style={styles.moduleText}>Crear administradores de complejo, modificar roles o eliminar usuarios.</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;

  if (screen === 'complexHome') content = <View style={styles.card}><Text style={styles.title}>Administrador del complejo</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><DashboardCards styles={styles} items={[{ label: 'Rol', value: 'Complejo', description: 'Puede administrar uno o más complejos asignados' }, { label: 'Usuario', value: userId, description: 'ID administrador complejo' }]} /><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('complexOps')}><Text style={styles.moduleTitle}>Campos y disponibilidad</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('reservations')}><Text style={styles.moduleTitle}>Reservas y pagos</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;

  if (screen === 'captainHome') content = <View style={styles.card}><CaptainDashboard styles={styles} userId={userId} onBack={() => setScreen('captainHome')} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'playerHome') content = <View style={styles.card}><Text style={styles.title}>Jugador participante</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><Text style={styles.moduleText}>Este perfil participa en partidos creados por un capitán. No crea reservas ni gestiona la bolsa.</Text><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  if (screen === 'systemComplexes') content = <View style={styles.card}><SystemComplexManagement styles={styles} systemAdminId={userId} /><Back /></View>;
  if (screen === 'systemUsers') content = <View style={styles.card}><UserManagement styles={styles} /><Back /></View>;
  if (screen === 'complexOps') content = <View style={styles.card}><ComplexOperations styles={styles} /><Back /></View>;
  if (screen === 'playerBooking') content = <View style={styles.card}><Text style={styles.title}>Buscar y reservar</Text><AvailabilitySlots userId={userId} styles={styles} /><Back /></View>;
  if (screen === 'reservations') content = <View style={styles.card}><Text style={styles.title}>Reservas</Text><TouchableOpacity style={styles.primaryButton} onPress={listReservations}><Text style={styles.buttonText}>Consultar reservas</Text></TouchableOpacity>{!!result && <Text style={styles.status}>{result}</Text>}<Back /></View>;
  if (screen === 'wallet') content = <View style={styles.card}><MatchWallet styles={styles} userId={userId} /><Back /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
