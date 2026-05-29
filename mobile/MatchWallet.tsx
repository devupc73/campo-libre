import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Props = {
  styles: any;
  userId: string;
};

export default function MatchWallet({ styles, userId }: Props) {
  const [reservationId, setReservationId] = useState('');
  const [payerUserId, setPayerUserId] = useState('');
  const [captainUserId, setCaptainUserId] = useState(userId || '1');
  const [sportsComplexId, setSportsComplexId] = useState('');
  const [amount, setAmount] = useState('30');
  const [method, setMethod] = useState('yape');
  const [message, setMessage] = useState('');

  async function createPayment(flow: string, type: string) {
    setMessage('Registrando pago...');

    try {
      const payload = {
        reservation_id: reservationId ? Number(reservationId) : null,
        payer_user_id: flow === 'player_to_captain' ? Number(payerUserId) : Number(captainUserId),
        receiver_user_id: flow === 'player_to_captain' ? Number(captainUserId) : null,
        sports_complex_id: flow === 'captain_to_complex' ? Number(sportsComplexId) : null,
        payment_flow: flow,
        payment_type: type,
        method,
        amount: Number(amount),
        status: 'paid',
      };

      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('payment_failed');

      const data = await response.json();
      setMessage(`Pago registrado. ID ${data.id} · S/ ${data.amount}`);
    } catch {
      setMessage('No se pudo registrar el pago.');
    }
  }

  return (
    <View>
      <Text style={styles.title}>Bolsa del partido</Text>
      <Text style={styles.subtitle}>Jugadores pagan al capitán y el capitán paga al complejo.</Text>

      <TextInput style={styles.input} placeholder="ID reserva" placeholderTextColor="#64748b" value={reservationId} onChangeText={setReservationId} />
      <TextInput style={styles.input} placeholder="ID jugador que paga" placeholderTextColor="#64748b" value={payerUserId} onChangeText={setPayerUserId} />
      <TextInput style={styles.input} placeholder="ID capitán/gestor" placeholderTextColor="#64748b" value={captainUserId} onChangeText={setCaptainUserId} />
      <TextInput style={styles.input} placeholder="ID complejo" placeholderTextColor="#64748b" value={sportsComplexId} onChangeText={setSportsComplexId} />
      <TextInput style={styles.input} placeholder="Monto" placeholderTextColor="#64748b" value={amount} onChangeText={setAmount} />
      <TextInput style={styles.input} placeholder="Método: yape, plin, efectivo, transferencia" placeholderTextColor="#64748b" value={method} onChangeText={setMethod} />

      <TouchableOpacity style={styles.primaryButton} onPress={() => createPayment('player_to_captain', 'contribution')}>
        <Text style={styles.buttonText}>Registrar aporte jugador</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => createPayment('captain_to_complex', 'advance')}>
        <Text style={styles.buttonText}>Registrar adelanto al complejo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => createPayment('captain_to_complex', 'full_payment')}>
        <Text style={styles.buttonText}>Registrar pago total al complejo</Text>
      </TouchableOpacity>

      {!!message && <Text style={styles.status}>{message}</Text>}
    </View>
  );
}
