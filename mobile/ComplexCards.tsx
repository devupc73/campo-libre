import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type SportsComplex = {
  id: number;
  name: string;
  address: string;
  description?: string;
  phone?: string;
  rating?: number;
};

type Props = {
  styles: any;
  onSelectComplex?: (complexId: string) => void;
};

export default function ComplexCards({ styles, onSelectComplex }: Props) {
  const [complexes, setComplexes] = useState<SportsComplex[]>([]);
  const [message, setMessage] = useState('');

  async function loadComplexes() {
    setMessage('Consultando complejos...');

    try {
      const response = await fetch(`${API_URL}/sports-complexes`);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setMessage('No hay complejos registrados.');
        return;
      }

      setComplexes(data);
      setMessage(`${data.length} complejos encontrados.`);
    } catch {
      setMessage('No se pudo consultar complejos.');
    }
  }

  return (
    <View>
      <Text style={styles.subtitle}>Complejos deportivos</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={loadComplexes}>
        <Text style={styles.buttonText}>Ver complejos</Text>
      </TouchableOpacity>

      {complexes.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.moduleButton}
          onPress={() => onSelectComplex && onSelectComplex(String(item.id))}
        >
          <Text style={styles.moduleTitle}>{item.name}</Text>
          <Text style={styles.moduleText}>{item.description || 'Complejo deportivo disponible'}</Text>
          <Text style={styles.moduleText}>Direccion: {item.address}</Text>
          <Text style={styles.moduleText}>Rating: {item.rating || 0}</Text>
          <Text style={styles.moduleText}>Contacto: {item.phone || 'No registrado'}</Text>
          <Text style={styles.moduleText}>ID: {item.id} · tocar para seleccionar</Text>
        </TouchableOpacity>
      ))}

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
