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

      setSelectedUser(null);
      setMessage('Usuario eliminado');
      loadUsers();
    } catch {
      setMessage('No se pudo eliminar');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Usuarios registrados</Text>

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
