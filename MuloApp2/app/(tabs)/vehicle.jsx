import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { C } from '../../src/theme'

const ScoreRing = ({ score, band }) => {
  const color = band === 'Platinum' ? C.green : band === 'Gold' ? C.teal : band === 'Bronze' ? C.amber : C.muted
  return (
    <View style={[s.scoreRing, { borderColor: color }]}>
      <Text style={[s.scoreNum, { color }]}>{score}</Text>
      <Text style={s.scoreLabel}>/ 100</Text>
      <Text style={[s.scoreBand, { color }]}>{band}</Text>
    </View>
  )
}

export default function VehicleScreen() {
  // Placeholder — will be populated from telematics API
  const score = { drive_score: 78, score_band: 'Gold', premium_adjustment: -0.09,
    trip_count: 42, total_km: 3840, monthly_km_avg: 1280, confidence: 0.91,
    components: { braking: 82, speeding: 74, acceleration: 78, cornering: 80, time_of_day: 71, mileage: 80 }
  }
  const health = {
    vehicle_health_score: 74,
    service: { due_in_km: 1200, due_date: '2026-09-15' },
    battery: { health_score: 61, risk_level: 'medium', alert: false },
    tyres:   { wear_index: 38, km_remaining: 18000 },
    brakes:  { wear_pct: 29, km_remaining: 22000 },
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Vehicle Health</Text>
        <Text style={s.headerSub}>Powered by Muḽo Telematics</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Drive Score */}
        <View style={s.scoreCard}>
          <ScoreRing score={score.drive_score} band={score.score_band} />
          <View style={{ flex: 1 }}>
            <Text style={s.scoreTitle}>Muḽo Drive Score</Text>
            <Text style={s.scoreSub}>{score.trip_count} trips · {score.total_km.toLocaleString()} km recorded</Text>
            <View style={[s.savingsBadge]}>
              <Text style={s.savingsText}>
                💚 Saving {Math.abs(Math.round(score.premium_adjustment * 100))}% on car insurance
              </Text>
            </View>
          </View>
        </View>

        {/* Score components */}
        <Text style={s.sectionTitle}>Score breakdown</Text>
        {Object.entries(score.components).map(([key, val]) => (
          <View key={key} style={s.componentRow}>
            <Text style={s.componentLabel}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${val}%`, backgroundColor: val >= 80 ? C.green : val >= 60 ? C.teal : C.amber }]} />
            </View>
            <Text style={s.componentVal}>{val}</Text>
          </View>
        ))}

        {/* Health predictions */}
        <Text style={s.sectionTitle}>Vehicle health</Text>
        {[
          { icon: '🔧', label: 'Next service', value: `${health.service.due_in_km.toLocaleString()} km away`, sub: health.service.due_date, color: C.teal },
          { icon: '🔋', label: 'Battery health', value: `${health.battery.health_score}/100`, sub: health.battery.risk_level + ' risk', color: health.battery.risk_level === 'low' ? C.green : health.battery.risk_level === 'medium' ? C.amber : C.danger },
          { icon: '⚫', label: 'Tyre wear', value: `${health.tyres.wear_index}% worn`, sub: `~${health.tyres.km_remaining.toLocaleString()} km remaining`, color: health.tyres.wear_index < 50 ? C.green : C.amber },
          { icon: '🛑', label: 'Brake pads', value: `${health.brakes.wear_pct}% worn`, sub: `~${health.brakes.km_remaining.toLocaleString()} km remaining`, color: health.brakes.wear_pct < 50 ? C.green : C.amber },
        ].map((item, i) => (
          <View key={i} style={s.healthCard}>
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.healthLabel}>{item.label}</Text>
              <Text style={[s.healthValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.healthSub}>{item.sub}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.navy },
  header:         { padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:    { fontSize: 24, fontWeight: '800', color: C.white },
  headerSub:      { fontSize: 12, color: C.muted, marginTop: 4 },
  scoreCard:      { backgroundColor: C.navyLight, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 24, borderWidth: 1, borderColor: C.teal + '44' },
  scoreRing:      { width: 90, height: 90, borderRadius: 45, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum:       { fontSize: 28, fontWeight: '800' },
  scoreLabel:     { fontSize: 10, color: C.muted },
  scoreBand:      { fontSize: 12, fontWeight: '700', marginTop: 2 },
  scoreTitle:     { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 4 },
  scoreSub:       { fontSize: 12, color: C.muted, marginBottom: 8 },
  savingsBadge:   { backgroundColor: C.green + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.green + '44' },
  savingsText:    { fontSize: 11, color: C.green, fontWeight: '600' },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  componentRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  componentLabel: { fontSize: 12, color: C.muted, width: 110 },
  barTrack:       { flex: 1, height: 6, backgroundColor: C.subtle, borderRadius: 3, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 3 },
  componentVal:   { fontSize: 12, fontWeight: '700', color: C.white, width: 28, textAlign: 'right' },
  healthCard:     { backgroundColor: C.navyLight, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  healthLabel:    { fontSize: 12, color: C.muted, marginBottom: 2 },
  healthValue:    { fontSize: 15, fontWeight: '700' },
  healthSub:      { fontSize: 11, color: C.muted, marginTop: 2 },
})
