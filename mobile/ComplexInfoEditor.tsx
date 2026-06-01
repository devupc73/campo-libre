import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ComplexInfoEditor({ styles, selectedComplex, onUpdated }: any) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('-12.0464');
  const [longitude, setLongitude] = useState('-77.0428');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setName(selectedComplex?.name || '');
    setAddress(selectedComplex?.address || '');
    setLatitude(String(selectedComplex?.latitude || '-12.0464'));
    setLongitude(String(selectedComplex?.longitude || '-77.0428'));
    setPhone(selectedComplex?.phone || '');
    setDescription(selectedComplex?.description || '');
  }, [selectedComplex?.id]);

  async function saveComplex() {
    try {
      const response = await fetch(`${API_URL}/sports-complexes/${selectedComplex?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          phone,
          description,
          image_url: selectedComplex?.image_url || '',
          rating: selectedComplex?.rating || 0,
          system_admin_user_id: selectedComplex?.system_admin_user_id || null,
          complex_admin_user_id: selectedComplex?.complex_admin_user_id || null,
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage('Complejo actualizado correctamente');
      if (onUpdated) onUpdated(data);
    } catch {
      setMessage('No se pudo actualizar el complejo');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Datos del complejo</Text>
      <Text style={styles.subtitle}>Edita la información general del complejo seleccionado.</Text>

      <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor="#64748b" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Latitud" placeholderTextColor="#64748b" value={latitude} onChangeText={setLatitude} />
      <TextInput style={styles.input} placeholder="Longitud" placeholderTextColor="#64748b" value={longitude} onChangeText={setLongitude} />
      <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#64748b" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor="#64748b" value={description} onChangeText={setDescription} />

      <TouchableOpacity style={styles.primaryButton} onPress={saveComplex}>
        <Text style={styles.buttonText}>Actualizar complejo</Text>
      </TouchableOpacity>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
