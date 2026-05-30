import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const roleOptions = [
  { label: 'Administrador sistema', value: 'system_admin' },
  { label: 'Administrador complejo', value: 'complex_admin' },
  { label: 'Capitán', value: 'captain' },
  { label: 'Jugador', value: 'player' },
];

export default function UserManagement({ styles }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('player');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/users/`);
      const data = await response.json();
      setUsers(data || []);
    } catch {
      setMessage('No se pudo cargar usuarios');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function clearForm() {
    setSelectedUser(null);
    setFullName('');
    setEmail('');
    setRole('complex_admin');
    setPassword('123456');
  }

  async function createComplexAdmin() {
    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: '',
          role: 'complex_admin',
          password,
        }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setMessage(`Administrador de complejo creado. ID ${data.id}`);
      clearForm();
      loadUsers();
    } catch {
      setMessage('No se pudo crear el administrador de complejo');
    }
  }

  async function updateUser() {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, role }),
      });

      if (!response.ok) throw new Error();

      setMessage('Usuario actualizado');
      loadUsers();
    } catch {
      setMessage('No se pudo actualizar');
    }
  }

  async function deleteUser() {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      clearForm();
      setMessage('Usuario eliminado');
      loadUsers();
    } catch {
      setMessage('No se pudo eliminar');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Usuarios registrados</Text>
      <Text style={styles.subtitle}>Crear administrador de complejo</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre administrador"
        placeholderTextColor="#64748b"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email administrador"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password inicial"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={createComplexAdmin}>
        <Text style={styles.buttonText}>Crear administrador de complejo</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Modificar usuario existente</Text>

      <ComboSelect
        styles={styles}
        label="Seleccionar usuario"
        value={selectedUser ? String(selectedUser.id) : ''}
        options={users.map((u) => ({
          label: `${u.full_name} (${u.role})`,
          value: String(u.id),
        }))}
        onChange={(value) => {
          const user = users.find((u) => String(u.id) === value);
          setSelectedUser(user);
          setFullName(user?.full_name || '');
          setEmail(user?.email || '');
          setRole(user?.role || 'player');
          setPassword('');
        }}
      />

      {selectedUser && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
          />

          <ComboSelect
            styles={styles}
            label="Rol"
            value={role}
            options={roleOptions}
            onChange={setRole}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={updateUser}>
            <Text style={styles.buttonText}>Actualizar usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={deleteUser}>
            <Text style={styles.buttonText}>Eliminar usuario</Text>
          </TouchableOpacity>
        </>
      )}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
