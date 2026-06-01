import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComplexOperations from './ComplexOperations';
import ComplexReports from './ComplexReports';
import ComplexSelector from './ComplexSelector';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Props = {
  styles: any;
  onLogout: () => void;
};

export default function ComplexAdminPortal({ styles, onLogout }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [assignedComplexes, setAssignedComplexes] = useState<any[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'operations' | 'reports'>('reports');
  const [message, setMessage] = useState('');

  function logoutLocal() {
    setEmail('');
    setPassword('');
    setUserId('');
    setUserName('');
    setAssignedComplexes([]);
    setSelectedComplex(null);
    setActiveSection('reports');
    setMessage('');
    onLogout();
  }

  async function loadAssignedComplexes(adminUserId: string) {
    const response = await fetch(`${API_URL}/complex-admin/complexes/${adminUserId}`);
    const data = await response.json();
    setAssignedComplexes(Array.isArray(data) ? data : []);
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

      if (data.role !== 'complex_admin') {
        setMessage('Este acceso es exclusivo para administradores de complejo.');
        return;
      }

      setUserId(String(data.user_id));
      setUserName(data.full_name);
      await loadAssignedComplexes(String(data.user_id));
      setMessage('');
    } catch {
      setMessage('No se pudo iniciar sesión o cargar complejos asignados.');
    }
  }

  if (!userId) {
    return (
      <View>
        <Text style={styles.title}>Administrador de complejo</Text>
        <Text style={styles.subtitle}>URL: /complex-admin</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.primaryButton} onPress={login}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>
        {!!message && <Text style={styles.status}>{message}</Text>}
      </View>
    );
  }

  if (!selectedComplex) {
    return (
      <View>
        <Text style={styles.subtitle}>Bienvenido, {userName}</Text>
        {assignedComplexes.length ? (
          <ComplexSelector
            styles={styles}
            complexes={assignedComplexes}
            onSelect={(complex: any) => {
              setSelectedComplex(complex);
              setActiveSection('reports');
            }}
          />
        ) : (
          <>
            <Text style={styles.title}>Sin complejos asignados</Text>
            <Text style={styles.subtitle}>Solicita al administrador del sistema que te asigne uno o más complejos.</Text>
          </>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={logoutLocal}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Administrador de complejo</Text>
      <Text style={styles.subtitle}>{selectedComplex.name}</Text>

      <TouchableOpacity style={activeSection === 'reports' ? styles.primaryButton : styles.secondaryButton} onPress={() => setActiveSection('reports')}>
        <Text style={styles.buttonText}>Indicadores y consultas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={activeSection === 'operations' ? styles.primaryButton : styles.secondaryButton} onPress={() => setActiveSection('operations')}>
        <Text style={styles.buttonText}>Mantenimiento operativo</Text>
      </TouchableOpacity>

      {activeSection === 'operations' ? (
        <ComplexOperations styles={styles} selectedComplex={selectedComplex} />
      ) : (
        <ComplexReports styles={styles} selectedComplex={selectedComplex} />
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedComplex(null)}>
        <Text style={styles.buttonText}>Cambiar complejo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={logoutLocal}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
