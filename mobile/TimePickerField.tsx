import React from 'react';
import { Text, View } from 'react-native';
import ComboSelect from './ComboSelect';

const hourOptions = Array.from({ length: 24 }, (_, hour) => ({ label: String(hour).padStart(2, '0'), value: String(hour).padStart(2, '0') }));
const minuteOptions = ['00', '15', '30', '45'].map((minute) => ({ label: minute, value: minute }));

export default function TimePickerField({ styles, label, value, onChange }: any) {
  const [hour = '08', minute = '00'] = String(value || '08:00').slice(0, 5).split(':');
  return <View style={{ marginBottom: 12 }}>
    <Text style={styles.moduleText}>{label}</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><ComboSelect styles={styles} label="Hora" value={hour} options={hourOptions} onChange={(next: string) => onChange(`${next}:${minute}`)} /></View>
      <View style={{ flex: 1 }}><ComboSelect styles={styles} label="Minutos" value={minuteOptions.some((item) => item.value === minute) ? minute : '00'} options={minuteOptions} onChange={(next: string) => onChange(`${hour}:${next}`)} /></View>
    </View>
  </View>;
}
