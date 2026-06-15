import React from 'react';
import { Text, View } from 'react-native';
import ComplexInfoEditor from './ComplexInfoEditor';

export default function ComplexSettingsPage({ styles, selectedComplex }: any) {
  return (
    <View>
      <Text style={styles.title}>Datos del complejo</Text>
      <Text style={styles.subtitle}>Actualiza la información administrativa del complejo.</Text>
      <ComplexInfoEditor styles={styles} selectedComplex={selectedComplex} />
    </View>
  );
}
