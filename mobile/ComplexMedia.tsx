import React from 'react';
import { Image, Platform, Text, TextInput, View } from 'react-native';

function readImageFile(event: any, onChange: (value: string) => void) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  if (!String(file.type || '').startsWith('image/')) return;
  if (file.size > 2 * 1024 * 1024) {
    if (typeof window !== 'undefined') window.alert('La imagen debe pesar como máximo 2 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onChange(String(reader.result || ''));
  reader.readAsDataURL(file);
}

export function ComplexMediaEditor({ styles, imageUrl, logoUrl, onImageChange, onLogoChange }: any) {
  const fileInput = (label: string, onChange: (value: string) => void) => Platform.OS === 'web'
    ? React.createElement('label', { style: { display: 'block', color: '#a9b8cc', marginBottom: 12 } },
        label,
        React.createElement('input', {
          type: 'file', accept: 'image/*',
          onChange: (event: any) => readImageFile(event, onChange),
          style: { display: 'block', marginTop: 8, color: '#fff' },
        }))
    : null;

  return <View style={{ marginTop: 14 }}>
    <Text style={styles.cardTitle}>Imagen comercial del complejo</Text>
    <Text style={styles.moduleText}>Puedes pegar una URL pública o seleccionar un archivo de hasta 2 MB. Ambos campos son opcionales.</Text>
    <TextInput style={styles.input} placeholder="URL de foto principal" placeholderTextColor="#718198" value={imageUrl} onChangeText={onImageChange} />
    {fileInput('Seleccionar foto del complejo', onImageChange)}
    <TextInput style={styles.input} placeholder="URL del logo" placeholderTextColor="#718198" value={logoUrl} onChangeText={onLogoChange} />
    {fileInput('Seleccionar logo del complejo', onLogoChange)}
    <ComplexMediaDisplay styles={styles} imageUrl={imageUrl} logoUrl={logoUrl} compact />
  </View>;
}

export function ComplexMediaDisplay({ styles, complex, imageUrl, logoUrl, compact = false }: any) {
  const photo = complex?.image_url ?? imageUrl;
  const logo = complex?.logo_url ?? logoUrl;
  if (!photo && !logo) return null;

  return <View style={{ marginTop: 12, marginBottom: 12 }}>
    {!!photo && <Image source={{ uri: photo }} resizeMode="cover" style={{ width: '100%', height: compact ? 150 : 220, borderRadius: 16, backgroundColor: '#10243a' }} />}
    {!!logo && <View style={{ marginTop: photo ? -34 : 0, marginLeft: 14, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 8, borderWidth: 2, borderColor: '#dbeafe' }}>
      <Image source={{ uri: logo }} resizeMode="contain" style={{ width: compact ? 70 : 92, height: compact ? 70 : 92 }} />
    </View>}
    {!compact && <Text style={styles.muted}>Imagen y logo registrados por el complejo.</Text>}
  </View>;
}
