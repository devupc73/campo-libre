import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';

export default function ComplexSelector({ styles, complexes, onSelect }: any) {
  const [selectedComplexId, setSelectedComplexId] = useState('');

  return (
    <View>
      <Text style={styles.title}>Selecciona el complejo a administrar</Text>
      <Text style={styles.subtitle}>Solo se muestran los complejos asignados a tu usuario.</Text>

      <ComboSelect
        styles={styles}
        label="Complejo asignado"
        value={selectedComplexId}
        options={complexes.map((complex: any) => ({
          label: `${complex.name} (${complex.address})`,
          value: String(complex.id),
        }))}
        onChange={(value) => setSelectedComplexId(value)}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          const complex = complexes.find((item: any) => String(item.id) === selectedComplexId);
          if (complex) onSelect(complex);
        }}
      >
        <Text style={styles.buttonText}>Administrar complejo seleccionado</Text>
      </TouchableOpacity>
    </View>
  );
}
