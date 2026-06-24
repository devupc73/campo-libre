import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReceiptImageInput({ styles, label, value, onChange }: any) {
  function pickFile() {
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onChange(String(reader.result || ''));
      reader.readAsDataURL(file);
    };
    input.click();
  }

  const isImage = typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('http'));

  return (
    <View>
      <Text style={styles.moduleTitle}>{label}</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={pickFile}>
        <Text style={styles.buttonText}>Adjuntar imagen de constancia</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="También puedes pegar un link de imagen o constancia"
        placeholderTextColor="#64748b"
        value={value || ''}
        onChangeText={onChange}
      />
      {isImage && (
        <Image
          source={{ uri: value }}
          style={{ width: '100%', height: 220, resizeMode: 'contain', borderRadius: 12, marginTop: 8 }}
        />
      )}
    </View>
  );
}
