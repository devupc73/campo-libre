import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePickerField from './DatePickerField';
import TimePickerField from './TimePickerField';

export default function CaptainCreateMatchPage({ styles, title, setTitle, matchDate, setMatchDate, matchTime, setMatchTime, location, setLocation, maxPlayers, setMaxPlayers, fee, setFee, paymentDeadline, setPaymentDeadline, onCreate }: any) {
  return (
    <View>
      <Text style={styles.title}>Nueva convocatoria</Text>
      <Text style={styles.subtitle}>Completa los datos principales. Las fechas y horas se seleccionan sin escribir formatos manualmente.</Text>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
      <DatePickerField styles={styles} label="Fecha del partido" value={matchDate} onChange={setMatchDate} />
      <TimePickerField styles={styles} label="Hora del partido" value={matchTime || '20:00'} onChange={setMatchTime} />
      <TextInput style={styles.input} placeholder="Lugar tentativo" placeholderTextColor="#64748b" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Cantidad de jugadores" placeholderTextColor="#64748b" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Pago por jugador" placeholderTextColor="#64748b" value={fee} onChangeText={setFee} keyboardType="numeric" />
      <DatePickerField styles={styles} label="Fecha límite de pago" value={paymentDeadline} onChange={setPaymentDeadline} />
      <TouchableOpacity style={styles.primaryButton} onPress={onCreate}>
        <Text style={styles.buttonText}>Crear convocatoria</Text>
      </TouchableOpacity>
    </View>
  );
}
