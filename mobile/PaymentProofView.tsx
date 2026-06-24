import React from 'react';
import { Image, Text, View } from 'react-native';

export default function PaymentProofView({ styles, proof }: any) {
  if (!proof) return null;

  const isImage = String(proof).startsWith('data:image') || String(proof).startsWith('http');

  return (
    <View>
      <Text style={styles.moduleText}>Constancia: {String(proof).startsWith('data:image') ? 'Imagen adjunta' : proof}</Text>
      {isImage && (
        <Image
          source={{ uri: proof }}
          style={{ width: '100%', height: 220, marginTop: 12, borderRadius: 12, backgroundColor: '#020617' }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
