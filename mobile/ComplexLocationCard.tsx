import React from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  styles: any;
  complex?: any;
  latitude?: string | number | null;
  longitude?: string | number | null;
  address?: string | null;
  title?: string;
  compact?: boolean;
};

function validCoordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

export function googleMapsUrl(latitude?: unknown, longitude?: unknown, address?: string | null) {
  const query = validCoordinate(latitude) && validCoordinate(longitude)
    ? `${Number(latitude)},${Number(longitude)}`
    : (address || '').trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
}

export default function ComplexLocationCard({ styles, complex, latitude, longitude, address, title = 'Ubicación del complejo', compact = false }: Props) {
  const lat = complex?.latitude ?? latitude;
  const lng = complex?.longitude ?? longitude;
  const resolvedAddress = complex?.address ?? address ?? '';
  const mapsUrl = googleMapsUrl(lat, lng, resolvedAddress);
  const hasCoordinates = validCoordinate(lat) && validCoordinate(lng);
  const embedUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${Number(lat)},${Number(lng)}`)}&z=16&output=embed`
    : resolvedAddress
      ? `https://maps.google.com/maps?q=${encodeURIComponent(resolvedAddress)}&z=16&output=embed`
      : '';

  if (!mapsUrl) {
    return <Text style={styles.status}>Este complejo todavía no tiene una ubicación registrada.</Text>;
  }

  return (
    <View style={{ marginTop: 14, marginBottom: 16, backgroundColor: '#071b12', borderRadius: 18, borderWidth: 1, borderColor: '#1f6f4a', padding: 14, overflow: 'hidden' }}>
      <Text style={styles.cardTitle}>📍 {title}</Text>
      {!!resolvedAddress && <Text style={styles.moduleText}>{resolvedAddress}</Text>}
      {hasCoordinates && <Text style={styles.muted}>Lat. {Number(lat).toFixed(6)} · Long. {Number(lng).toFixed(6)}</Text>}

      {Platform.OS === 'web' && !compact && embedUrl
        ? React.createElement('iframe', {
            src: embedUrl,
            title,
            width: '100%',
            height: '260',
            style: { border: 0, borderRadius: 14, marginTop: 12 },
            loading: 'lazy',
            referrerPolicy: 'no-referrer-when-downgrade',
          })
        : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={async () => {
          const supported = await Linking.canOpenURL(mapsUrl);
          if (supported) await Linking.openURL(mapsUrl);
        }}
      >
        <Text style={styles.buttonText}>Abrir ubicación en Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}
