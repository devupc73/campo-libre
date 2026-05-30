import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Option = {
  label: string;
  value: string;
};

type Props = {
  styles: any;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function ComboSelect({ styles, label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value);

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.moduleText}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(!open)}>
        <Text style={{ color: '#fff' }}>{selected ? selected.label : 'Seleccionar'}</Text>
      </TouchableOpacity>

      {open && options.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={styles.secondaryButton}
          onPress={() => {
            onChange(item.value);
            setOpen(false);
          }}
        >
          <Text style={styles.buttonText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
