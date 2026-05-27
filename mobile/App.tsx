import React from 'react';
import { SafeAreaView, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a'
      }}
    >
      <View style={{ alignItems: 'center', padding: 24 }}>
        <Text
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 12
          }}
        >
          Campo Libre
        </Text>

        <Text
          style={{
            fontSize: 18,
            color: '#cbd5e1',
            textAlign: 'center',
            marginBottom: 30
          }}
        >
          Reserva tus campos deportivos y organiza tus partidos.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#22c55e',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 10
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 16
            }}
          >
            Comenzar
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
