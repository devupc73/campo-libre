import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  icon?: string;
  badge?: string;
};

type ActionProps = {
  styles: any;
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  active?: boolean;
  accent?: 'green' | 'blue' | 'amber' | 'violet';
};

const accents: Record<string, string> = {
  green: '#22c55e',
  blue: '#38bdf8',
  amber: '#f59e0b',
  violet: '#a78bfa',
};

export function SportsHero({ eyebrow = 'CAMPO LIBRE', title, subtitle, icon = '⚽', badge }: HeroProps) {
  return (
    <View style={{
      borderRadius: 24,
      padding: 24,
      marginBottom: 18,
      overflow: 'hidden',
      backgroundColor: '#064e3b',
      backgroundImage: 'linear-gradient(135deg, #052e16 0%, #047857 52%, #16a34a 100%)',
      boxShadow: '0 18px 50px rgba(0,0,0,.28)',
      position: 'relative',
    } as any}>
      <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(255,255,255,.14)', right: -70, top: -80 }} />
      <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,.12)', right: 22, bottom: -64 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#bbf7d0', fontWeight: '800', letterSpacing: 2, fontSize: 12 }}>{eyebrow}</Text>
          <Text style={{ color: '#fff', fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 8 }}>{title}</Text>
          <Text style={{ color: '#dcfce7', fontSize: 16, lineHeight: 24, marginTop: 10, maxWidth: 650 }}>{subtitle}</Text>
          {!!badge && <View style={{ alignSelf: 'flex-start', marginTop: 16, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: '#fff', fontWeight: '700' }}>{badge}</Text></View>}
        </View>
        <View style={{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)' }}>
          <Text style={{ fontSize: 38 }}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

export function SportsAction({ styles, icon, title, description, onPress, active = false, accent = 'green' }: ActionProps) {
  const color = accents[accent];
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: 16,
      marginTop: 10,
      backgroundColor: active ? `${color}20` : '#111c2f',
      borderWidth: 1,
      borderColor: active ? color : '#26344d',
      boxShadow: active ? `0 10px 30px ${color}24` : '0 8px 24px rgba(0,0,0,.16)',
    } as any}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.moduleTitle}>{title}</Text>
        {!!description && <Text style={styles.moduleText}>{description}</Text>}
      </View>
      <Text style={{ color, fontSize: 22, fontWeight: '900' }}>›</Text>
    </TouchableOpacity>
  );
}

export function SportsSectionTitle({ title, subtitle, icon = '🏟️' }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 8 }}>
      <View style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#163026' }}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{title}</Text>
        {!!subtitle && <Text style={{ color: '#94a3b8', marginTop: 2 }}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function SportsPill({ text, tone = 'green' }: { text: string; tone?: 'green' | 'blue' | 'amber' | 'violet' }) {
  const color = accents[tone];
  return <View style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: `${color}1f`, borderWidth: 1, borderColor: `${color}66` }}><Text style={{ color, fontWeight: '800', fontSize: 12 }}>{text}</Text></View>;
}
