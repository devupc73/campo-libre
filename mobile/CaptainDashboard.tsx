import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CaptainCollectionReports from './CaptainCollectionReports';
import CaptainCreateMatchPage from './CaptainCreateMatchPage';
import CaptainDashboardHome from './CaptainDashboardHome';
import CaptainMatchesPage from './CaptainMatchesPage';
import CaptainNearbyComplexes from './CaptainNearbyComplexes';
import CaptainOfficialAssociation from './CaptainOfficialAssociation';
import CaptainPaymentValidationPanel from './CaptainPaymentValidationPanel';
import { SportsAction, SportsHero, SportsSectionTitle } from './SportsBrand';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
type CaptainSection = 'home' | 'create' | 'matches' | 'payments' | 'official' | 'participants' | 'complexes' | 'reports';

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
        body: JSON.stringify({ captain_user_id: Number(userId), title, sport: 'futbol', max_players: Number(maxPlayers), tentative_location: location, match_date: matchDate, match_time: matchTime, payment_deadline: paymentDeadline, player_fee: Number(fee), paid_to_complex: 0, sports_complex_id: null, court_id: null, schedule_id: null }),
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
      setSummary(await summaryResponse.json());
      setSection(nextSection);
    } catch { setMessage('No se pudo cargar el detalle de la convocatoria'); }
  }

  async function registerPayment(participantId: number) {
    try {
      await fetch(`${API_URL}/match-participants/${participantId}/payment`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_method: 'yape', paid_amount: Number(selectedMatch?.player_fee || 0) }) });
      if (selectedMatch) await openMatch(selectedMatch, 'participants');
      await loadMatches();
    } catch { setMessage('No se pudo registrar el pago'); }
  }

  async function validatePayment(participantId: number, status: string) {
    try {
      const response = await fetch(`${API_URL}/match-participants/${participantId}/payment-validation`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_validation_status: status }) });
      if (!response.ok) throw new Error();
      setMessage(status === 'validated' ? 'Pago validado correctamente.' : status === 'observed' ? 'Pago observado.' : 'Pago rechazado.');
      if (selectedMatch) await openMatch(selectedMatch, 'payments');
      await loadMatches();
    } catch { setMessage('No se pudo actualizar la validación del pago'); }
  }

  async function afterOfficialAssociationSaved(updatedMatch: any) { setSelectedMatch(updatedMatch); await loadMatches(); await openMatch(updatedMatch, 'official'); }
  const pendingPayments = participants.filter((p) => p.payment_status === 'paid' && p.payment_validation_status === 'pending_validation');
  const renderParticipants = () => !selectedMatch ? <Text style={styles.status}>Selecciona una convocatoria.</Text> : <View><SportsSectionTitle title="Plantel convocado" subtitle={selectedMatch.title} icon="👥" /><Text style={styles.status}>Código privado: {selectedMatch.invitation_code || '-'}</Text>{participants.map((p) => <View key={p.id} style={styles.moduleButton}><Text style={styles.cardTitle}>Jugador #{p.user_id}</Text><Text style={styles.moduleText}>Estado: {p.status}</Text><Text style={styles.moduleText}>Pago: {p.payment_status}</Text><Text style={styles.moduleText}>Validación: {p.payment_validation_status || '-'}</Text>{p.payment_status !== 'paid' && <TouchableOpacity style={styles.primaryButton} onPress={() => registerPayment(p.id)}><Text style={styles.buttonText}>Registrar pago manual</Text></TouchableOpacity>}</View>)}</View>;

  function renderContent() {
    if (section === 'create') return <CaptainCreateMatchPage styles={styles} title={title} setTitle={setTitle} matchDate={matchDate} setMatchDate={setMatchDate} matchTime={matchTime} setMatchTime={setMatchTime} location={location} setLocation={setLocation} maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers} fee={fee} setFee={setFee} paymentDeadline={paymentDeadline} setPaymentDeadline={setPaymentDeadline} onCreate={createMatch} />;
    if (section === 'matches') return <CaptainMatchesPage styles={styles} matches={matches} onOpenMatch={(match: any) => openMatch(match, 'participants')} />;
    if (section === 'payments') return <CaptainPaymentValidationPanel styles={styles} participants={participants} onValidate={validatePayment} />;
    if (section === 'complexes') return <CaptainNearbyComplexes styles={styles} />;
    if (section === 'official') return selectedMatch ? <CaptainOfficialAssociation styles={styles} userId={userId} selectedMatch={selectedMatch} onSaved={afterOfficialAssociationSaved} /> : <Text style={styles.status}>Selecciona una convocatoria desde “Mis convocatorias”.</Text>;
    if (section === 'participants') return renderParticipants();
    if (section === 'reports') return <CaptainCollectionReports styles={styles} userId={userId} matches={matches} />;
    return <CaptainDashboardHome styles={styles} matches={matches} summary={summary} pendingPaymentsCount={pendingPayments.length || summary?.pending_validation_players || 0} onNavigate={setSection} />;
  }

  return <ScrollView>
    <SportsHero eyebrow="CAPITÁN / GESTOR" title="Tu equipo, tu partido" subtitle="Convoca jugadores, controla pagos y asegura la cancha para el próximo encuentro." icon="🧢" badge={`${matches.length} convocatorias`} />
    <SportsSectionTitle title="Centro de juego" subtitle="Todo lo que necesitas para organizar tu partido" icon="⚡" />
    <SportsAction styles={styles} icon="🏠" title="Resumen" description="Indicadores y próximos pasos." onPress={() => setSection('home')} active={section === 'home'} />
    <SportsAction styles={styles} icon="➕" title="Nueva convocatoria" description="Crea un partido y comparte el código." onPress={() => setSection('create')} active={section === 'create'} accent="blue" />
    <SportsAction styles={styles} icon="📋" title="Mis convocatorias" description="Revisa jugadores, cupos y estado." onPress={() => setSection('matches')} active={section === 'matches'} accent="amber" />
    <SportsAction styles={styles} icon="📍" title="Complejos cercanos" description="Compara campos, capacidades y distancia desde tu ubicación." onPress={() => setSection('complexes')} active={section === 'complexes'} accent="green" />
    <SportsAction styles={styles} icon="💳" title="Validar pagos" description="Confirma aportes de los participantes." onPress={() => setSection('payments')} active={section === 'payments'} accent="violet" />
    <SportsAction styles={styles} icon="📊" title="Reportes de recaudación" description="Consulta pagos por convocatoria, consolidado y saldo disponible." onPress={() => setSection('reports')} active={section === 'reports'} accent="blue" />
    <SportsAction styles={styles} icon="🏟️" title="Reserva oficial" description="Asocia una convocatoria con cancha y horario." onPress={() => setSection('official')} active={section === 'official'} accent="green" />
    <View style={{ marginTop: 22 }}>{renderContent()}</View>
    {!!message && <Text style={styles.status}>{message}</Text>}
    <TouchableOpacity style={styles.secondaryButton} onPress={onBack}><Text style={styles.buttonText}>Volver</Text></TouchableOpacity>
  </ScrollView>;
}
