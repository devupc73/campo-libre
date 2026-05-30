import React from 'react';
import { Text, View } from 'react-native';

export default function DashboardCards({ styles, items }: any) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
      {items.map((item: any, index: number) => (
        <View
          key={index}
          style={{
            backgroundColor: '#172554',
            borderRadius: 16,
            padding: 18,
            width: 220,
            borderWidth: 1,
            borderColor: '#1e3a8a',
          }}
        >
          <Text style={{ color: '#93c5fd', fontSize: 13, marginBottom: 8 }}>
            {item.label}
          </Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: 'bold' }}>
            {item.value}
          </Text>
          {!!item.description && (
            <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 8 }}>
              {item.description}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
