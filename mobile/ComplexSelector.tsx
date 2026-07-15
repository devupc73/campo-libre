import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ComboSelect from './ComboSelect';
import ComplexLocationCard from './ComplexLocationCard';

export default function ComplexSelector({ styles, complexes, onSelect }: any) {
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const selectedComplex = complexes.find((item: any) => String(item.id) === selectedComplexId);

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
        onChange={setSelectedComplexId}
      />

      {!!selectedComplex && <ComplexLocationCard styles={styles} complex={selectedComplex} title={`Cómo llegar a ${selectedComplex.name}`} />}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (selectedComplex) onSelect(selectedComplex);
        }}
      >
        <Text style={styles.buttonText}>Administrar complejo seleccionado</Text>
      </TouchableOpacity>
    </View>
  );
}
