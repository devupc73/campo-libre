import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function ComplexSelector({ styles, complexes, onSelect }: any) {
  return (
    <View>
      <Text style={styles.title}>Selecciona el complejo a administrar</Text>
      <Text style={styles.subtitle}>Puedes administrar uno o varios complejos.</Text>

      {complexes.map((complex: any) => (
        <TouchableOpacity
          key={complex.id}
          style={styles.moduleButton}
          onPress={() => onSelect(complex)}
        >
          <Text style={styles.moduleTitle}>{complex.name}</Text>
          <Text style={styles.moduleText}>{complex.address}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
