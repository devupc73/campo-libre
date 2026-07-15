import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CaptainDashboard from './CaptainDashboard';
import ComboSelect from './ComboSelect';
import ComplexAdminPortal from './ComplexAdminPortal';
import PlayerConvocations from './PlayerConvocations';
import { SportsAction, SportsHero, SportsSectionTitle } from './SportsBrand';
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
  page: { flex: 1, backgroundColor: '#07111f', backgroundImage: 'radial-gradient(circle at 12% 10%, #123523 0, #07111f 34%, #050b14 100%)' } as any,
  container: { flexGrow: 1, alignItems: 'center' as const, padding: 24, paddingVertical: 38 },
  card: { width: '100%' as const, maxWidth: 980, backgroundColor: 'rgba(10,20,35,.94)', borderRadius: 26, padding: 24, borderWidth: 1, borderColor: '#25344d', boxShadow: '0 24px 80px rgba(0,0,0,.38)' } as any,
  title: { fontSize: 29, fontWeight: '900' as const, color: '#fff', marginBottom: 8, textAlign: 'left' as const },
  subtitle: { fontSize: 16, color: '#a9b8cc', textAlign: 'left' as const, marginBottom: 16, marginTop: 6, lineHeight: 23 },
  input: { backgroundColor: '#081322', borderColor: '#31435f', borderWidth: 1, color: '#fff', padding: 15, borderRadius: 13, marginBottom: 12, outlineStyle: 'none' } as any,
  primaryButton: { backgroundColor: '#16a34a', paddingVertical: 15, paddingHorizontal: 24, borderRadius: 13, marginTop: 8, boxShadow: '0 10px 28px rgba(34,197,94,.22)' } as any,
  secondaryButton: { backgroundColor: '#17243a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 13, marginTop: 10, borderWidth: 1, borderColor: '#2b3b56' },
  moduleButton: { backgroundColor: '#111c2f', padding: 17, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#2a3a55' },
  dangerButton: { backgroundColor: '#7f1d1d', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 13, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '800' as const, fontSize: 16, textAlign: 'center' as const },
  moduleTitle: { color: '#fff', fontWeight: '800' as const, fontSize: 17 },
  moduleText: { color: '#a9b8cc', fontSize: 14, marginTop: 4, lineHeight: 20 },
  muted: { color: '#718198', fontSize: 13, textAlign: 'center' as const, marginTop: 14 },
  status: { color: '#fde68a', fontSize: 14, textAlign: 'center' as const, marginTop: 14, padding: 10, borderRadius: 10, backgroundColor: 'rgba(245,158,11,.10)' },
  cardTitle: { color: '#fff', fontWeight: '900' as const, fontSize: 19, marginBottom: 7 },
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
    setPortal(nextPortal); setScreen('portal'); setMessage('');
    if (typeof window !== 'undefined') window.history.pushState({}, '', path);
  }
  function goHome() {
    setPortal('home'); setScreen('portal'); setUserId(''); setUserName(''); setMessage('');
    if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
  }
  function logout() { setUserId(''); setUserName(''); setMessage(''); setScreen('portal'); }

  async function checkBackendConnection() {
    setMessage('Comprobando conexión con backend...');
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(`Backend conectado: ${data.application || 'campo-libre-api'} (${data.status || 'ok'})`);
    } catch { setMessage(`No se pudo conectar con el backend: ${API_URL}`); }
  }

  async function login() {
    setMessage('Iniciando sesión...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (portal === 'general' && !['captain', 'player'].includes(data.role)) { setMessage('Este acceso es solo para capitanes y jugadores.'); return; }
      if (portal === 'system' && data.role !== 'system_admin') { setMessage('Este acceso es exclusivo para administrador del sistema.'); return; }
      setUserId(String(data.user_id)); setUserName(data.full_name); setMessage('');
      if (data.role === 'system_admin') setScreen('systemHome');
      else if (data.role === 'captain') setScreen('captainHome');
      else setScreen('playerHome');
    } catch { setMessage('No se pudo iniciar sesión. Revisa tus credenciales.'); }
  }

  async function registerPublic() {
    setMessage('Registrando usuario...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, email, phone, bank_account: bankAccount, interbank_account: interbankAccount, role, password }) });
      if (!response.ok) throw new Error();
      setMessage('Usuario registrado. Ahora inicia sesión.'); setScreen('login');
    } catch { setMessage('No se pudo registrar. Revisa los datos ingresados.'); }
  }

  async function registerSystemAdmin() {
    setMessage('Registrando administrador del sistema...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, email, phone: '', role: 'system_admin', password }) });
      if (!response.ok) throw new Error();
      setMessage('Administrador registrado. Ahora inicia sesión.'); setScreen('login');
    } catch { setMessage('No se pudo registrar el administrador del sistema.'); }
  }

  const authForm = (title: string, subtitle: string) => (
    <View>
      <SportsHero eyebrow="ACCESO SEGURO" title={title} subtitle={subtitle} icon="🔐" />
      <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#718198" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#718198" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Ingresar a mi cuenta</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );

  let content = null;
  if (portal === 'home') {
    content = <View style={styles.card}>
      <SportsHero title="Tu partido empieza aquí" subtitle="Encuentra canchas, organiza convocatorias y gestiona complejos deportivos desde una sola experiencia." icon="🏟️" badge="Reserva • Juega • Gestiona" />
      <SportsSectionTitle title="Elige tu experiencia" subtitle="Accede según lo que quieres hacer hoy" icon="⚡" />
      <SportsAction styles={styles} icon="⚽" title="Jugadores y capitanes" description="Crea equipos, participa en convocatorias y organiza tus partidos." onPress={() => go('general', '/general')} accent="green" />
      <SportsAction styles={styles} icon="🏟️" title="Administrador de complejo" description="Gestiona campos, horarios, reservas y operación comercial." onPress={() => go('complex', '/complex-admin')} accent="blue" />
      <SportsAction styles={styles} icon="📊" title="Administrador del sistema" description="Controla usuarios, complejos y salud de la plataforma." onPress={() => go('system', '/admin-system')} accent="violet" />
      <Text style={styles.muted}>Campo Libre · Tecnología para vivir el deporte</Text>
    </View>;
  } else if (portal === 'complex') {
    content = <View style={styles.card}><ComplexAdminPortal styles={styles} onLogout={logout} /></View>;
  } else if (screen === 'portal' && portal === 'general') {
    content = <View style={styles.card}><SportsHero eyebrow="COMUNIDAD DEPORTIVA" title="Juega, organiza y conecta" subtitle="Gestiona tus convocatorias, pagos y partidos con una experiencia simple y rápida." icon="🥅" /><SportsAction styles={styles} icon="🔐" title="Ingresar" description="Continúa con tus convocatorias y partidos." onPress={() => setScreen('login')} /><SportsAction styles={styles} icon="✨" title="Crear una cuenta" description="Regístrate como jugador o capitán." onPress={() => setScreen('register')} accent="blue" /><TouchableOpacity style={styles.secondaryButton} onPress={goHome}><Text style={styles.buttonText}>Volver al inicio</Text></TouchableOpacity></View>;
  } else if (screen === 'portal' && portal === 'system') {
    content = <View style={styles.card}><SportsHero eyebrow="CONTROL CENTRAL" title="Administración Campo Libre" subtitle="Visibilidad integral de la red de complejos, usuarios y operación." icon="🛡️" /><SportsAction styles={styles} icon="🔐" title="Ingresar al panel" onPress={() => setScreen('login')} accent="violet" /><SportsAction styles={styles} icon="👤" title="Registrar administrador" onPress={() => setScreen('systemRegister')} accent="blue" /><SportsAction styles={styles} icon="🟢" title="Comprobar conexión" description="Valida la disponibilidad del backend." onPress={checkBackendConnection} accent="green" /><TouchableOpacity style={styles.secondaryButton} onPress={goHome}><Text style={styles.buttonText}>Volver al inicio</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'login') {
    content = <View style={styles.card}>{authForm(portal === 'system' ? 'Panel administrativo' : 'Bienvenido de vuelta', portal === 'system' ? 'Acceso reservado para la administración de la plataforma.' : 'Ingresa para continuar con tu experiencia deportiva.')}</View>;
  } else if (screen === 'register') {
    content = <View style={styles.card}><SportsHero eyebrow="ÚNETE A LA COMUNIDAD" title="Crea tu perfil deportivo" subtitle="Organiza partidos o participa como jugador en pocos minutos." icon="🏃" /><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#718198" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#718198" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Celular / Yape" placeholderTextColor="#718198" value={phone} onChangeText={setPhone} /><TextInput style={styles.input} placeholder="Cuenta bancaria" placeholderTextColor="#718198" value={bankAccount} onChangeText={setBankAccount} /><TextInput style={styles.input} placeholder="Cuenta interbancaria" placeholderTextColor="#718198" value={interbankAccount} onChangeText={setInterbankAccount} /><TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#718198" value={password} onChangeText={setPassword} secureTextEntry /><ComboSelect styles={styles} label="¿Cómo usarás Campo Libre?" value={role} options={roleOptions} onChange={(value) => setRole(value as Role)} /><TouchableOpacity style={styles.primaryButton} onPress={registerPublic}><Text style={styles.buttonText}>Crear mi cuenta</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'systemRegister') {
    content = <View style={styles.card}><SportsHero eyebrow="ALTA ADMINISTRATIVA" title="Nuevo administrador" subtitle="Crea un acceso de control para la plataforma." icon="🧑‍💻" /><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#718198" value={fullName} onChangeText={setFullName} /><TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#718198" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#718198" value={password} onChangeText={setPassword} secureTextEntry /><TouchableOpacity style={styles.primaryButton} onPress={registerSystemAdmin}><Text style={styles.buttonText}>Registrar administrador</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('portal')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>{!!message && <Text style={styles.status}>{message}</Text>}</View>;
  } else if (screen === 'systemHome') {
    content = <View style={styles.card}><SportsHero eyebrow="ADMINISTRACIÓN" title={`Hola, ${userName}`} subtitle="Monitorea el crecimiento y operación de Campo Libre." icon="📈" badge="Panel del sistema" /><SystemAdminKpis styles={styles} /><SportsAction styles={styles} icon="🏟️" title="Gestionar complejos" description="Alta, asignación y control de sedes deportivas." onPress={() => setScreen('systemComplexes')} accent="blue" /><SportsAction styles={styles} icon="👥" title="Gestionar usuarios" description="Administra roles y accesos de la comunidad." onPress={() => setScreen('systemUsers')} accent="violet" /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  } else if (screen === 'systemComplexes') {
    content = <View style={styles.card}><SportsHero eyebrow="RED DEPORTIVA" title="Gestión de complejos" subtitle="Administra las sedes disponibles en Campo Libre." icon="🏟️" /><SystemComplexManagement styles={styles} systemAdminId={userId} /><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemHome')}><Text style={styles.buttonText}>Volver al panel</Text></TouchableOpacity></View>;
  } else if (screen === 'systemUsers') {
    content = <View style={styles.card}><SportsHero eyebrow="COMUNIDAD" title="Gestión de usuarios" subtitle="Controla perfiles, roles y accesos." icon="👥" /><UserManagement styles={styles} /><TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('systemHome')}><Text style={styles.buttonText}>Volver al panel</Text></TouchableOpacity></View>;
  } else if (screen === 'captainHome') {
    content = <View style={styles.card}><CaptainDashboard styles={styles} userId={userId} onBack={() => setScreen('captainHome')} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  } else if (screen === 'playerHome') {
    content = <View style={styles.card}><PlayerConvocations styles={styles} userId={userId} /><TouchableOpacity style={styles.secondaryButton} onPress={logout}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity></View>;
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.container}>{content}</ScrollView></SafeAreaView>;
}
