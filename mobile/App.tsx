import React, { useState } from 'react';
import { SafeAreaView, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';

type Screen = 'home' | 'login' | 'register' | 'dashboard';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const styles = {
  page: { flex: 1, backgroundColor: '#0f172a' },
  container: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 460, backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  title: { fontSize: 36, fontWeight: 'bold' as const, color: '#ffffff', marginBottom: 10, textAlign: 'center' as const },
  subtitle: { fontSize: 17, color: '#cbd5e1', textAlign: 'center' as const, marginBottom: 24 },
  input: { backgroundColor: '#020617', borderColor: '#334155', borderWidth: 1, color: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 12 },
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 8 },
  secondaryButton: { backgroundColor: '#334155', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#ffffff', fontWeight: 'bold' as const, fontSize: 16, textAlign: 'center' as const },
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

  async function checkBackend() {
    setMessage('Validando conexion con backend...');
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setMessage(`Backend OK: ${data.status || 'ok'}`);
    } catch {
      setMessage('No se pudo conectar con el backend. Revisa URL del API o CORS.');
    }
  }

  async function register() {
    setMessage('Registrando usuario...');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: '', role: 'player', password }),
      });

      if (!response.ok) throw new Error('register_failed');

      setMessage('Usuario registrado. Ahora inicia sesion.');
      setScreen('login');
    } catch {
      setMessage('Error en registro. Verifica datos o backend.');
    }
  }

  async function login() {
    setMessage('Iniciando sesion...');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('login_failed');

      const data = await response.json();
      setToken(data.access_token);
      setMessage('Sesion iniciada correctamente.');
      setScreen('dashboard');
    } catch {
      setMessage('No se pudo iniciar sesion. Verifica usuario y password.');
    }
  }

  let content = null;

  if (screen === 'home') {
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Campo Libre</Text>
        <Text style={styles.subtitle}>Reserva campos deportivos, convoca jugadores, registra pagos y arma equipos.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('login')}><Text style={styles.buttonText}>Iniciar sesion</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('register')}><Text style={styles.buttonText}>Crear cuenta</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={checkBackend}><Text style={styles.buttonText}>Probar backend</Text></TouchableOpacity>
        {!!message && <Text style={styles.status}>{message}</Text>}
        <Text style={styles.muted}>API configurada: {API_URL}</Text>
      </View>
    );
  }

  if (screen === 'login') {
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.primaryButton} onPress={login}><Text style={styles.buttonText}>Entrar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>
        {!!message && <Text style={styles.status}>{message}</Text>}
      </View>
    );
  }

  if (screen === 'register') {
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Crear cuenta</Text>
        <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.primaryButton} onPress={register}><Text style={styles.buttonText}>Registrarme</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>
        {!!message && <Text style={styles.status}>{message}</Text>}
      </View>
    );
  }

  if (screen === 'dashboard') {
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Panel</Text>
        <Text style={styles.subtitle}>Sesion activa. Ya podemos construir reservas, convocatorias y pagos.</Text>
        <Text style={styles.muted}>Token: {token ? `${token.substring(0, 24)}...` : 'sin token'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('home')}><Text style={styles.buttonText}>Cerrar sesion</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>{content}</ScrollView>
    </SafeAreaView>
  );
}
