import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DashboardCards from './DashboardCards';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function SystemAdminKpis({ styles }: any) {
  const [complexesCount, setComplexesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [complexAdminsCount, setComplexAdminsCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadKpis();
  }, []);

  async function loadKpis() {
    setMessage('Cargando indicadores...');
    try {
      const [complexesResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/sports-complexes`),
        fetch(`${API_URL}/users/`),
      ]);

      const complexes = await complexesResponse.json();
      const users = await usersResponse.json();
      const userList = Array.isArray(users) ? users : [];

      setComplexesCount(Array.isArray(complexes) ? complexes.length : 0);
      setUsersCount(userList.length);
      setComplexAdminsCount(userList.filter((user) => user.role === 'complex_admin').length);
      setPlayersCount(userList.filter((user) => user.role === 'player' || user.role === 'captain').length);
      setMessage('');
    } catch {
      setMessage('No se pudieron cargar los indicadores.');
    }
  }

  return (
    <View>
      <DashboardCards
        styles={styles}
        items={[
          { label: 'Complejos registrados', value: complexesCount, description: 'Total en la plataforma' },
          { label: 'Usuarios registrados', value: usersCount, description: 'Total de cuentas creadas' },
          { label: 'Admins. de complejo', value: complexAdminsCount, description: 'Usuarios operativos' },
          { label: 'Jugadores/capitanes', value: playersCount, description: 'Usuarios del portal general' },
        ]}
      />
      <TouchableOpacity style={styles.secondaryButton} onPress={loadKpis}>
        <Text style={styles.buttonText}>Actualizar indicadores</Text>
      </TouchableOpacity>
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
