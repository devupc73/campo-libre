import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexLocationCard from './ComplexLocationCard';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function responseMessage(response: Response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

export default function SystemComplexManagement({ styles, systemAdminId }: any) {
  const [complexes, setComplexes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [complexName, setComplexName] = useState('');
  const [complexAddress, setComplexAddress] = useState('');
  const [complexLat, setComplexLat] = useState('-12.0464');
  const [complexLng, setComplexLng] = useState('-77.0428');
  const [complexAdminId, setComplexAdminId] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      const complexResponse = await fetch(`${API_URL}/sports-complexes?include_inactive=true`);
      const userResponse = await fetch(`${API_URL}/users/`);
      if (!complexResponse.ok) throw new Error(await responseMessage(complexResponse));
      if (!userResponse.ok) throw new Error(await responseMessage(userResponse));
      const complexData = await complexResponse.json();
      const userData = await userResponse.json();
      setComplexes(Array.isArray(complexData) ? complexData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error: any) {
      setMessage(error.message || 'No se pudo cargar complejos o usuarios.');
    }
  }

  useEffect(() => { loadData(); }, []);

  function fillComplex(complex: any) {
    setSelectedComplex(complex);
    setComplexName(complex?.name || '');
    setComplexAddress(complex?.address || '');
    setComplexLat(String(complex?.latitude ?? '-12.0464'));
    setComplexLng(String(complex?.longitude ?? '-77.0428'));
    setComplexAdminId(complex?.complex_admin_user_id ? String(complex.complex_admin_user_id) : '');
  }

  async function saveAssignment(complexId: number) {
    if (!complexAdminId) return;
    const response = await fetch(`${API_URL}/complex-admin/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complex_id: complexId, admin_user_id: Number(complexAdminId) }),
    });
    if (!response.ok) throw new Error(await responseMessage(response));
  }

  async function saveComplex(update = false) {
    setMessage(update ? 'Actualizando complejo...' : 'Creando complejo...');
    try {
      const payload = {
        name: complexName, address: complexAddress, latitude: Number(complexLat), longitude: Number(complexLng),
        system_admin_user_id: Number(systemAdminId), complex_admin_user_id: complexAdminId ? Number(complexAdminId) : null,
        description: selectedComplex?.description || '', phone: selectedComplex?.phone || '', image_url: selectedComplex?.image_url || '', rating: selectedComplex?.rating || 0,
      };
      const url = update && selectedComplex ? `${API_URL}/sports-complexes/${selectedComplex.id}` : `${API_URL}/sports-complexes`;
      const response = await fetch(url, { method: update ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(await responseMessage(response));
      const data = await response.json();
      await saveAssignment(data.id);
      fillComplex(data);
      setMessage(`Complejo guardado y administrador asignado. ID ${data.id}`);
      await loadData();
    } catch (error: any) {
      setMessage(error.message || 'No se pudo guardar el complejo o asignar administrador.');
    }
  }

  async function changeStatus(status: 'active' | 'inactive') {
    if (!selectedComplex) {
      setMessage('Selecciona un complejo antes de cambiar su estado.');
      return;
    }

    setMessage(status === 'inactive' ? 'Desactivando complejo...' : 'Reactivando complejo...');
    try {
      const response = await fetch(`${API_URL}/sports-complexes/${selectedComplex.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, system_admin_user_id: Number(systemAdminId) }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const updated = await response.json();
      fillComplex(updated);
      await loadData();
      setMessage(status === 'inactive'
        ? 'Complejo desactivado. Ya no será visible para jugadores, gestores ni administradores de complejo.'
        : 'Complejo reactivado y disponible nuevamente.');
    } catch (error: any) {
      setMessage(error.message || 'No se pudo actualizar el estado del complejo.');
    }
  }

  const selectedStatus = String(selectedComplex?.status || 'active').toLowerCase();

  return (
    <View>
      <Text style={styles.title}>Gestión de complejos</Text>
      <Text style={styles.subtitle}>Crea complejos, valida su geoposición, asigna administradores y controla su disponibilidad.</Text>
      <ComboSelect styles={styles} label="Seleccionar complejo existente" value={selectedComplex ? String(selectedComplex.id) : ''}
        options={complexes.map((item) => ({ label: `${item.name} · ${String(item.status || 'active').toLowerCase() === 'inactive' ? 'INACTIVO' : 'ACTIVO'} (${item.address})`, value: String(item.id) }))}
        onChange={(value) => fillComplex(complexes.find((item) => String(item.id) === value))} />
      {!!selectedComplex && <Text style={styles.status}>Estado actual: {selectedStatus === 'inactive' ? 'INACTIVO' : 'ACTIVO'}</Text>}
      <TextInput style={styles.input} placeholder="Nombre complejo" placeholderTextColor="#64748b" value={complexName} onChangeText={setComplexName} />
      <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="#64748b" value={complexAddress} onChangeText={setComplexAddress} />
      <TextInput style={styles.input} placeholder="Latitud" placeholderTextColor="#64748b" value={complexLat} onChangeText={setComplexLat} />
      <TextInput style={styles.input} placeholder="Longitud" placeholderTextColor="#64748b" value={complexLng} onChangeText={setComplexLng} />
      <ComplexLocationCard styles={styles} latitude={complexLat} longitude={complexLng} address={complexAddress} title="Vista previa de geoposición" />
      <ComboSelect styles={styles} label="Administrador del complejo" value={complexAdminId}
        options={users.filter((user) => user.role === 'complex_admin').map((user) => ({ label: `${user.full_name} (${user.email})`, value: String(user.id) }))}
        onChange={setComplexAdminId} />
      <TouchableOpacity style={styles.primaryButton} onPress={() => saveComplex(false)}><Text style={styles.buttonText}>Crear complejo</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => saveComplex(true)}><Text style={styles.buttonText}>Actualizar complejo seleccionado</Text></TouchableOpacity>
      {selectedComplex && selectedStatus !== 'inactive' && <TouchableOpacity style={styles.dangerButton} onPress={() => changeStatus('inactive')}><Text style={styles.buttonText}>Desactivar complejo</Text></TouchableOpacity>}
      {selectedComplex && selectedStatus === 'inactive' && <TouchableOpacity style={styles.primaryButton} onPress={() => changeStatus('active')}><Text style={styles.buttonText}>Reactivar complejo</Text></TouchableOpacity>}
      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
