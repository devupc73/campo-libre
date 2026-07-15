import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CaptainCreateMatchPage({ styles, title, setTitle, matchDate, setMatchDate, matchTime, setMatchTime, location, setLocation, maxPlayers, setMaxPlayers, fee, setFee, paymentDeadline, setPaymentDeadline, onCreate }: any) {
  return (
    <View>
      <Text style={styles.title}>Nueva convocatoria</Text>
      <Text style={styles.subtitle}>Crea primero la convocatoria. Luego podrás asociarla oficialmente a un complejo, campo y franja.</Text>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Fecha YYYY-MM-DD" placeholderTextColor="#64748b" value={matchDate} onChangeText={setMatchDate} />
      <TextInput style={styles.input} placeholder="Hora HH:MM:SS" placeholderTextColor="#64748b" value={matchTime} onChangeText={setMatchTime} />
      <TextInput style={styles.input} placeholder="Lugar tentativo" placeholderTextColor="#64748b" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Cantidad jugadores" placeholderTextColor="#64748b" value={maxPlayers} onChangeText={setMaxPlayers} />
      <TextInput style={styles.input} placeholder="Pago por jugador" placeholderTextColor="#64748b" value={fee} onChangeText={setFee} />
      <TextInput style={styles.input} placeholder="Fecha límite pago" placeholderTextColor="#64748b" value={paymentDeadline} onChangeText={setPaymentDeadline} />
      <TouchableOpacity style={styles.primaryButton} onPress={onCreate}>
        <Text style={styles.buttonText}>Crear convocatoria</Text>
      </TouchableOpacity>
    </View>
  );
}
