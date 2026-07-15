import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CaptainCreateMatchPage from './CaptainCreateMatchPage';
import CaptainDashboardHome from './CaptainDashboardHome';
import CaptainMatchesPage from './CaptainMatchesPage';
import CaptainOfficialAssociation from './CaptainOfficialAssociation';
import CaptainPaymentValidationPanel from './CaptainPaymentValidationPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
type CaptainSection = 'home' | 'create' | 'matches' | 'payments' | 'official' | 'participants';

export default function CaptainDashboard({ styles, userId, onBack }: any) {
  const [section, setSection] = useState<CaptainSection>('home');
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Pichanga viernes');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('14');
  const [fee, setFee] = useState('25');
  const [paymentDeadline, setPaymentDeadline] = useState('');

  useEffect(() => { loadMatches(); }, []);

  async function loadMatches() {
    try {
      const response = await fetch(`${API_URL}/matches?captain_user_id=${userId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch { setMessage('No se pudieron cargar las convocatorias'); }
  }

  async function createMatch() {
    try {
      const response = await fetch(`${API_URL}/matches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captain_user_id: Number(userId), title, sport: 'futbol', max_players: Number(maxPlayers),
          tentative_location: location, match_date: matchDate, match_time: matchTime,
          payment_deadline: paymentDeadline, player_fee: Number(fee), paid_to_complex: 0,
          sports_complex_id: null, court_id: null, schedule_id: null,
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessage(`Convocatoria creada. Código para compartir: ${data.invitation_code || '-'}`);
      await loadMatches(); setSection('matches');
    } catch { setMessage('No se pudo crear la convocatoria'); }
  }

  async function openMatch(match: any, nextSection: CaptainSection = 'participants') {
    setSelectedMatch(match);
    try {
      const participantsResponse = await fetch(`${API_URL}/match-participants?match_id=${match.id}`);
      const participantsData = await participantsResponse.json();
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      const summaryResponse = await fetch(`${API_URL}/matches/${match.id}/summary`);
      setSummary(await summaryResponse.json()); setSection(nextSection);
    } catch { setMessage('No se pudo cargar el detalle de la convocatoria'); }
  }

  async function registerPayment(participantId: number) {
    try {
      await fetch(`${API_URL}/match-participants/${participantId}/payment`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: 'yape', paid_amount: Number(selectedMatch?.player_fee || 0) }),
      });
      if (selectedMatch) await openMatch(selectedMatch, 'participants'); await loadMatches();
    } catch { setMessage('No se pudo registrar el pago'); }
  }

  async function validatePayment(participantId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/match-participants/${participantId}/payment-validation`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_validation_status: status }),
      });
      if (!response.ok) throw new Error();
      setMessage(status === 'validated' ? 'Pago validado correctamente.' : status === 'observed' ? 'Pago observado.' : 'Pago rechazado.');
      if (selectedMatch) await openMatch(selectedMatch, 'payments'); await loadMatches();
    } catch { setMessage('No se pudo actualizar la validación del pago'); }
  }

  async function afterOfficialAssociationSaved(updatedMatch: any) {
    setSelectedMatch(updatedMatch); await loadMatches(); await openMatch(updatedMatch, 'official');
  }

  const pendingPayments = participants.filter((p) => p.payment_status === 'paid' && p.payment_validation_status === 'pending_validation');
  const renderParticipants = () => !selectedMatch ? <Text style={styles.status}>Selecciona una convocatoria.</Text> : (
    <View><Text style={styles.title}>Participantes</Text><Text style={styles.subtitle}>{selectedMatch.title}</Text>
      <Text style={styles.status}>Código privado: {selectedMatch.invitation_code || '-'}</Text>
      {participants.map((p) => <View key={p.id} style={styles.card}><Text style={styles.cardTitle}>Jugador #{p.user_id}</Text>
        <Text style={styles.moduleText}>Estado: {p.status}</Text><Text style={styles.moduleText}>Pago: {p.payment_status}</Text>
        <Text style={styles.moduleText}>Validación: {p.payment_validation_status || '-'}</Text>
        {p.payment_status !== 'paid' && <TouchableOpacity style={styles.primaryButton} onPress={() => registerPayment(p.id)}><Text style={styles.buttonText}>Registrar pago manual</Text></TouchableOpacity>}
      </View>)}</View>
  );

  function renderContent() {
    if (section === 'create') return <CaptainCreateMatchPage styles={styles} title={title} setTitle={setTitle} matchDate={matchDate} setMatchDate={setMatchDate} matchTime={matchTime} setMatchTime={setMatchTime} location={location} setLocation={setLocation} maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers} fee={fee} setFee={setFee} paymentDeadline={paymentDeadline} setPaymentDeadline={setPaymentDeadline} onCreate={createMatch} />;
    if (section === 'matches') return <CaptainMatchesPage styles={styles} matches={matches} onOpenMatch={(match: any) => openMatch(match, 'participants')} />;
    if (section === 'payments') return <CaptainPaymentValidationPanel styles={styles} participants={participants} onValidate={validatePayment} />;
    if (section === 'official') return selectedMatch ? <CaptainOfficialAssociation styles={styles} userId={userId} selectedMatch={selectedMatch} onSaved={afterOfficialAssociationSaved} /> : <Text style={styles.status}>Selecciona una convocatoria desde “Mis convocatorias”.</Text>;
    if (section === 'participants') return renderParticipants();
    return <CaptainDashboardHome styles={styles} matches={matches} summary={summary} pendingPaymentsCount={pendingPayments.length || summary?.pending_validation_players || 0} onNavigate={setSection} />;
  }

  return <ScrollView><Text style={styles.title}>Capitán / gestor</Text><Text style={styles.subtitle}>Convocatorias privadas, pagos y reserva oficial.</Text>
    {(['home','create','matches','payments','official'] as CaptainSection[]).map((item) => <TouchableOpacity key={item} style={section === item ? styles.primaryButton : styles.secondaryButton} onPress={() => setSection(item)}><Text style={styles.buttonText}>{item === 'home' ? 'Inicio' : item === 'create' ? 'Nueva convocatoria' : item === 'matches' ? 'Mis convocatorias' : item === 'payments' ? 'Validar pagos' : 'Reserva oficial'}</Text></TouchableOpacity>)}
    {renderContent()}{!!message && <Text style={styles.status}>{message}</Text>}
    <TouchableOpacity style={styles.secondaryButton} onPress={onBack}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>
  </ScrollView>;
}
