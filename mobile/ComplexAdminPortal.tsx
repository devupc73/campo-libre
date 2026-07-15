import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComplexCalendarPage from './ComplexCalendarPage';
import ComplexDashboardPage from './ComplexDashboardPage';
import ComplexFieldsPage from './ComplexFieldsPage';
import ComplexReports from './ComplexReports';
import ComplexSelector from './ComplexSelector';
import ComplexSettingsPage from './ComplexSettingsPage';
import { SportsAction, SportsHero, SportsSectionTitle } from './SportsBrand';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
type Props = { styles: any; onLogout: () => void };
type Section = 'dashboard' | 'settings' | 'fields' | 'calendar' | 'reports';

export default function ComplexAdminPortal({ styles, onLogout }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [assignedComplexes, setAssignedComplexes] = useState<any[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [message, setMessage] = useState('');

  function logoutLocal() {
    setEmail(''); setPassword(''); setUserId(''); setUserName(''); setAssignedComplexes([]); setSelectedComplex(null); setActiveSection('dashboard'); setSelectedCourtId(''); setMessage(''); onLogout();
  }

  async function loadAssignedComplexes(adminUserId: string) {
    try {
      const response = await fetch(`${API_URL}/complex-admin/complexes/${adminUserId}`);
      const data = await response.json();
      setAssignedComplexes(Array.isArray(data) ? data : []);
    } catch { setAssignedComplexes([]); setMessage('No se pudieron cargar los complejos asignados.'); }
  }

  async function login() {
    setMessage('Iniciando sesión...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.role !== 'complex_admin') { setMessage('Este acceso es exclusivo para administradores de complejo.'); return; }
      setUserId(String(data.user_id)); setUserName(data.full_name); setMessage(''); await loadAssignedComplexes(String(data.user_id));
    } catch { setMessage('No se pudo iniciar sesión.'); }
  }

  function renderSection() {
    if (activeSection === 'settings') return <ComplexSettingsPage styles={styles} selectedComplex={selectedComplex} />;
    if (activeSection === 'fields') return <ComplexFieldsPage styles={styles} selectedComplex={selectedComplex} selectedCourtId={selectedCourtId} onSelectCourt={setSelectedCourtId} />;
    if (activeSection === 'calendar') return <ComplexCalendarPage styles={styles} selectedComplex={selectedComplex} courtId={selectedCourtId} onSelectCourt={setSelectedCourtId} />;
    if (activeSection === 'reports') return <ComplexReports styles={styles} selectedComplex={selectedComplex} />;
    return <ComplexDashboardPage styles={styles} selectedComplex={selectedComplex} onNavigate={setActiveSection} />;
  }

  if (!userId) return <View>
    <SportsHero eyebrow="GESTIÓN DEPORTIVA" title="Haz crecer tu complejo" subtitle="Administra campos, franjas, reservas e indicadores desde un panel pensado para operadores deportivos." icon="🏟️" badge="Portal del complejo" />
    <TextInput style={styles.input} placeholder="Correo del administrador" placeholderTextColor="#718198" value={email} onChangeText={setEmail} />
    <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#718198" value={password} onChangeText={setPassword} secureTextEntry />
    <TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Ingresar al complejo</Text></TouchableOpacity>
    {!!message && <Text style={styles.status}>{message}</Text>}
  </View>;

  if (!selectedComplex) return <View>
    <SportsHero eyebrow="MIS SEDES" title={`Bienvenido, ${userName}`} subtitle="Selecciona el complejo deportivo que deseas operar." icon="📍" badge={`${assignedComplexes.length} complejos asignados`} />
    {assignedComplexes.length ? <ComplexSelector styles={styles} complexes={assignedComplexes} onSelect={(complex: any) => { setSelectedComplex(complex); setActiveSection('dashboard'); setSelectedCourtId(''); }} /> : <View><Text style={styles.title}>Sin complejos asignados</Text><Text style={styles.subtitle}>Solicita al administrador del sistema que te asigne uno o más complejos.</Text></View>}
    <TouchableOpacity style={styles.secondaryButton} onPress={logoutLocal}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity>
  </View>;

  return <View>
    <SportsHero eyebrow="OPERACIÓN DEL COMPLEJO" title={selectedComplex.name} subtitle={selectedComplex.address || 'Gestiona la experiencia completa de esta sede deportiva.'} icon="🏟️" badge="Complejo activo" />
    <SportsSectionTitle title="Panel de operación" subtitle="Gestiona cada parte de la experiencia del cliente" icon="⚙️" />
    <SportsAction styles={styles} icon="📊" title="Dashboard" description="Resumen operativo y comercial." onPress={() => setActiveSection('dashboard')} active={activeSection === 'dashboard'} />
    <SportsAction styles={styles} icon="📝" title="Datos del complejo" description="Información comercial y de contacto." onPress={() => setActiveSection('settings')} active={activeSection === 'settings'} accent="blue" />
    <SportsAction styles={styles} icon="🥅" title="Campos deportivos" description="Crea, modifica y administra tus canchas." onPress={() => setActiveSection('fields')} active={activeSection === 'fields'} accent="amber" />
    <SportsAction styles={styles} icon="📅" title="Calendario semanal" description="Disponibilidad, tarifas y franjas." onPress={() => setActiveSection('calendar')} active={activeSection === 'calendar'} accent="green" />
    <SportsAction styles={styles} icon="📈" title="Reportes y consultas" description="Indicadores para tomar mejores decisiones." onPress={() => setActiveSection('reports')} active={activeSection === 'reports'} accent="violet" />
    <View style={{ marginTop: 22 }}>{renderSection()}</View>
    <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedComplex(null)}><Text style={styles.buttonText}>Cambiar complejo</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondaryButton} onPress={logoutLocal}><Text style={styles.buttonText}>Cerrar sesión</Text></TouchableOpacity>
  </View>;
}
