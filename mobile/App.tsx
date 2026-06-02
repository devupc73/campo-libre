import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CaptainDashboard from './CaptainDashboard';
import ComboSelect from './ComboSelect';
import ComplexAdminPortal from './ComplexAdminPortal';
import PlayerConvocations from './PlayerConvocations';
import SystemAdminKpis from './SystemAdminKpis';
import SystemComplexManagement from './SystemComplexManagement';
import UserManagement from './UserManagement';

type Portal = 'home' | 'general' | 'complex' | 'system';
type Screen = 'portal' | 'login' | 'register' | 'systemRegister' | 'systemHome' | 'systemComplexes' | 'systemUsers' | 'captainHome' | 'playerHome';
type Role = 'captain' | 'player';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const roleOptions = [
  { label: 'Capitán / gestor', value: 'captain' },
  { label: 'Jugador participante', value: 'player' },
];

function portalFromPath(): Portal {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin-system')) return 'system';
  if (path.includes('complex-admin')) return 'complex';
  if (path.includes('general')) return 'general';
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
  cardTitle: { color: '#fff', fontWeight: 'bold' as const, fontSize: 18, marginBottom: 6 },
};

export default function App() {
  const [portal, setPortal] = useState<Portal>(portalFromPath());
  const [screen, setScreen] = useState<Screen>('portal');
  const [role, setRole] = useState<Role>('player');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [interbankAccount, setInterbankAccount] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  function go(nextPortal: Portal, path: string) {
    setPortal(nextPortal);
    setScreen('portal');
    setMessage('');
    if (typeof window !== 'undefined') window.history.pushState({}, '', path);
  }

  function logout() {
    setUserId('');
    setUserName('');
    setMessage('');
    setScreen('portal');
  }

  async function login() {
    setMessage('Iniciando sesión...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();

      if (portal === 'general' && !['captain', 'player'].includes(data.role)) {
        setMessage('Este acceso es solo para capitanes y jugadores.');
        return;
      }
      if (portal === 'system' && data.role !== 'system_admin') {
        setMessage('Este acceso es exclusivo para administrador del sistema.');
        return;
      }

      setUserId(String(data.user_id));
      setUserName(data.full_name);
      setMessage('');
      if (data.role === 'system_admin') setScreen('systemHome');
      else if (data.role === 'captain') setScreen('captainHome');
      else setScreen('playerHome');
    } catch {
      setMessage('No se pudo iniciar sesión.');
    }
  }

  async function registerPublic() {
    setMessage('Registrando usuario...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          bank_account: bankAccount,
          interbank_account: interbankAccount,
          role,
          password,
        }),
      });
      if (!response.ok) throw new Error();
      setMessage('Usuario registrado. Ahora inicia sesión.');
      setScreen('login');
    } catch {
      setMessage('No se pudo registrar.');
    }
  }

  async function registerSystemAdmin() {
    setMessage('Registrando administrador del sistema...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: '', role: 'system_admin', password }),
      });
      if (!response.ok) throw new Error();
      setMessage('Administrador registrado. Ahora inicia sesión.');
      setScreen('login');
    } catch {
      setMessage('No se pudo registrar el administrador del sistema.');
    }
  }

  let content = null;

  if (portal === 'home') {
    content = <View style={styles.card}><Text style={styles.title}>Campo Libre</Text><Text style={styles.subtitle}>Selecciona el portal.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => go('general', '/general')}><Text style={styles.buttonText}>Jugadores y capitanes</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => go('complex', '/complex-admin')}><Text style={styles.buttonText}>Administrador de complejo</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => go('system', '/admin-system')}><Text style={styles.buttonText}>Administrador del sistema</Text></TouchableOpacity><Text style={styles.muted}>API: {API_URL}</Text></View>;
  } else if (portal === 'complex') {
    content = <View style={styles.card}><ComplexAdminPortal styles={styles} onLogout={logout} /></View>;
  } else if (screen === 'portal' && portal === 'general') {
    content = <View style={styles.card}><Text style={styles.title}>Jugadores y capitanes</Text><Text style={styles.subtitle}>URL: /general</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Ingresar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity></View>;
  } else if (screen === 'portal' && portal === 'system') {
    content = <View style={styles.card}><Text style={styles.title}>Administrador del sistema</Text><Text style={styles.subtitle}>URL: /admin-system</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Ingresar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemRegister')}><Text style={styles.buttonText}>Registrar administrador del sistema</Text></TouchableOpacity></View>;
  } else if (screen === 'login') {
    content = <View style={styles.card}><Text style={styles.title}>Login</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'register') {
    content = <View style={styles.card}><Text style={styles.title}>Registro público</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Celular / Yape" placeholderTextColor="#64748b" value={phone} onChangeText={setPhone} /><TextInput style={styles.input} placeholder="Cuenta bancaria" placeholderTextColor="#64748b" value={bankAccount} onChangeText={setBankAccount} /><TextInput style={styles.input} placeholder="Cuenta interbancaria" placeholderTextColor="#64748b" value={interbankAccount} onChangeText={setInterbankAccount} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><ComboSelect styles={styles} label="Tipo de cuenta" value={role} options={roleOptions} onChange={(value) => setRole(value as Role)} /><TouchableOpacity style={styles.primaryButton} onPress={registerPublic}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'systemRegister') {
    content = <View style={styles.card}><Text style={styles.title}>Registro system_admin</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={registerSystemAdmin}><Text style={styles.buttonText}>Registrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'systemHome') {
    content = <View style={styles.card}><Text style={styles.title}>Administrador del sistema</Text><Text style={styles.subtitle}>Bienvenido, {userName}</Text><SystemAdminKpis styles={styles} /><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('systemComplexes')}><Text style={styles.moduleTitle}>Gestionar complejos</Text></TouchableOpacity><TouchableOpacity style={styles.moduleButton} onPress={() => setScreen('systemUsers')}><Text style={styles.moduleTitle}>Gestionar usuarios</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  } else if (screen === 'systemComplexes') {
    content = <View style={styles.card}><SystemComplexManagement styles={styles} systemAdminId={userId} /><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemHome')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity></View>;
  } else if (screen === 'systemUsers') {
    content = <View style={styles.card}><UserManagement styles={styles} /><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemHome')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity></View>;
  } else if (screen === 'captainHome') {
    content = <View style={styles.card}><CaptainDashboard styles={styles} userId={userId} onBack={() => setScreen('captainHome')} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  } else if (screen === 'playerHome') {
    content = <View style={styles.card}><PlayerConvocations styles={styles} userId={userId} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
