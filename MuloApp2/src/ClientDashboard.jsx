/**
 * Muḽo — Unified Client Dashboard
 * Cross-product view: Refinance + Insurance + Telematics
 * One screen showing everything a Muḽo client needs to know
 */

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const C = {
  navy:      '#0A1628',
  navyLight: '#132035',
  navyMid:   '#0E2344',
  teal:      '#00B8A9',
  green:     '#1DB97A',
  white:     '#FFFFFF',
  muted:     'rgba(255,255,255,0.55)',
  subtle:    'rgba(255,255,255,0.08)',
  border:    'rgba(255,255,255,0.12)',
  danger:    '#FF5C5C',
  amber:     '#FFC000',
  blue:      '#1A73E8',
  lightBg:   '#F0F4F8',
  cardBg:    '#FFFFFF',
  textDark:  '#0A1628',
  textMid:   '#8FA3BE',
  textLight: '#C5D0DC',
}

// ── Demo data ──────────────────────────────────────────────────────────────────
const CLIENT = {
  firstName: 'Thabo',
  lastName:  'Nkosi',
  // Refinance
  refinance: {
    status:        'Settlement in progress',
    statusPct:     60,
    loanAmount:    517500,
    nextRepay:     6940,
    nextRepayDate: '1 Jul 2026 · Month 1 of 60',
    rate:          '11.25% p.a.',
    term:          60,
    monthly:       7543,
    monthlySaving: 4260,
    equity:        580000,
    muloScore:     82,
    disbAccount:   'Absa ••• ••• 2847',
    debtsSettled: [
      { name:'Wesbank vehicle finance', amt:128500, status:'settled', date:'Apr 14' },
      { name:'African Bank personal loan', amt:125000, status:'settled', date:'Apr 13' },
      { name:'Capitec credit card', amt:48000, status:'settling', date:'In progress' },
      { name:'FNB personal loan', amt:62000, status:'pending', date:'Pending' },
    ]
  },
  // Insurance
  insurance: {
    policies: [
      { product:'Car insurance',      insurer:'Naked Insurance', premium:689, status:'active',  cashback:689,  cashbackStatus:'pending', cashbackDate:'15 Jul 2026' },
      { product:'Buildings insurance', insurer:'Absa Insurance',  premium:521, status:'active',  cashback:521,  cashbackStatus:'pending', cashbackDate:'15 Jul 2026' },
    ],
    totalPremium:  1210,
    totalCashback: 1210,
    nextDebit:     '1 Jul 2026',
    renewalDate:   '1 Jun 2027',
  },
  // Telematics
  telematics: {
    driveScore:    78,
    scoreBand:     'Gold',
    premiumSaving: 9,
    tripCount:     42,
    totalKm:       3840,
    batteryHealth: 61,
    batteryRisk:   'medium',
    serviceKm:     1200,
    tyreWear:      38,
    brakeWear:     29,
    trackerSource: 'Sealtron',
  }
}

// ── Shared components ──────────────────────────────────────────────────────────
const SectionHeader = ({ emoji, title, subtitle, color=C.teal }) => (
  <View style={[s.sectionHeader, { borderLeftColor:color }]}>
    <View style={{ flex:1 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
        <Text style={{ fontSize:18 }}>{emoji}</Text>
        <Text style={s.sectionHeaderTitle}>{title}</Text>
      </View>
      {subtitle && <Text style={s.sectionHeaderSub}>{subtitle}</Text>}
    </View>
  </View>
)

const Card = ({ children, style }) => (
  <View style={[s.card, style]}>{children}</View>
)

const StatusPill = ({ label, color }) => (
  <View style={[s.statusPill, { backgroundColor:color+'22', borderColor:color+'44' }]}>
    <View style={[s.statusDot, { backgroundColor:color }]} />
    <Text style={[s.statusPillText, { color }]}>{label}</Text>
  </View>
)

const DetailRow = ({ label, value, valueColor, last=false }) => (
  <View style={[s.detailRow, last && { borderBottomWidth:0, marginBottom:0, paddingBottom:0 }]}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={[s.detailValue, valueColor && { color:valueColor }]}>{value}</Text>
  </View>
)

const MiniBar = ({ pct, color=C.teal }) => (
  <View style={s.miniBarTrack}>
    <View style={[s.miniBarFill, { width:`${Math.min(pct,100)}%`, backgroundColor:color }]} />
  </View>
)

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [expandRefinance,  setExpandRefinance]  = useState(true)
  const [expandInsurance,  setExpandInsurance]  = useState(true)
  const [expandTelematics, setExpandTelematics] = useState(true)
  const { refinance, insurance, telematics } = CLIENT

  const initials = (CLIENT.firstName[0] + CLIENT.lastName[0]).toUpperCase()

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.navy }} edges={['top']}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
          <Text style={s.headerSub}>My Dashboard</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* ── GREETING STRIP ─────────────────────────────────────────────── */}
      <View style={s.greetingStrip}>
        <View style={{ flex:1 }}>
          <Text style={s.greeting}>Good morning, {CLIENT.firstName} 👋</Text>
          <Text style={s.greetingSub}>Here's your Muḽo overview</Text>
        </View>
        <StatusPill label="All systems active" color={C.green} />
      </View>

      {/* ── QUICK STATS ────────────────────────────────────────────────── */}
      <View style={s.quickStats}>
        {[
          { label:'Monthly saving',  value:`R${refinance.monthlySaving.toLocaleString()}`, color:C.green },
          { label:'Drive Score',     value:`${telematics.driveScore}/100`,                 color:C.teal  },
          { label:'Active policies', value:`${insurance.policies.length}`,                 color:C.amber },
          { label:'Cashback due',    value:`R${insurance.totalCashback.toLocaleString()}`, color:C.green },
        ].map((stat,i) => (
          <View key={i} style={s.quickStat}>
            <Text style={[s.quickStatVal, { color:stat.color }]}>{stat.value}</Text>
            <Text style={s.quickStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex:1, backgroundColor:C.lightBg }}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
        showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — MUḼO REFINANCE
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity onPress={() => setExpandRefinance(p=>!p)} activeOpacity={0.8}>
          <SectionHeader emoji="🏦" title="Muḽo Refinance"
            subtitle={`R${refinance.loanAmount.toLocaleString()} · ${refinance.rate} · ${refinance.term} months`}
            color={C.teal} />
        </TouchableOpacity>

        {expandRefinance && (
          <>
            {/* Status card */}
            <Card style={{ marginBottom:10 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <Text style={s.cardTitle}>{refinance.status}</Text>
                <StatusPill label="Live" color={C.green} />
              </View>
              <MiniBar pct={refinance.statusPct} color={C.teal} />
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
                {['Approved','Disbursed','Settling','Complete'].map(l => (
                  <Text key={l} style={s.progressLabel}>{l}</Text>
                ))}
              </View>
            </Card>

            {/* Repayment + savings */}
            <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
              <Card style={{ flex:1 }}>
                <Text style={s.miniCardLabel}>Next repayment</Text>
                <Text style={[s.miniCardVal, { color:C.navy }]}>R {refinance.nextRepay.toLocaleString()}</Text>
                <Text style={s.miniCardSub}>{refinance.nextRepayDate}</Text>
              </Card>
              <Card style={{ flex:1 }}>
                <Text style={s.miniCardLabel}>Monthly saving</Text>
                <Text style={[s.miniCardVal, { color:C.green }]}>R {refinance.monthlySaving.toLocaleString()}</Text>
                <Text style={s.miniCardSub}>vs previous debt</Text>
              </Card>
            </View>

            {/* Debt settlement tracker */}
            <Card style={{ marginBottom:16 }}>
              <Text style={s.cardTitle}>Debt settlement tracker</Text>
              <View style={{ marginTop:10, gap:8 }}>
                {refinance.debtsSettled.map((d,i) => {
                  const color = d.status==='settled'?C.green:d.status==='settling'?C.teal:C.muted
                  const icon  = d.status==='settled'?'✓':d.status==='settling'?'⟳':'○'
                  return (
                    <View key={i} style={[s.debtRow, i===refinance.debtsSettled.length-1&&{borderBottomWidth:0,marginBottom:0,paddingBottom:0}]}>
                      <View style={[s.debtIcon, { backgroundColor:color+'18', borderColor:color+'44' }]}>
                        <Text style={{ fontSize:12, color }}>{icon}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={s.debtName}>{d.name}</Text>
                        <Text style={s.debtDate}>{d.date}</Text>
                      </View>
                      <View style={{ alignItems:'flex-end' }}>
                        <Text style={s.debtAmt}>R{(d.amt/1000).toFixed(0)}k</Text>
                        <Text style={[s.debtStatus, { color }]}>{d.status}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — MUḼO INSURE
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity onPress={() => setExpandInsurance(p=>!p)} activeOpacity={0.8}>
          <SectionHeader emoji="🛡️" title="Muḽo Insure"
            subtitle={`${insurance.policies.length} active policies · R${insurance.totalPremium}/mo`}
            color={C.green} />
        </TouchableOpacity>

        {expandInsurance && (
          <>
            {/* Cashback status */}
            <Card style={{ marginBottom:10, backgroundColor:C.green+'18', borderWidth:1, borderColor:C.green+'33' }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <View>
                  <Text style={s.miniCardLabel}>Total cashback due</Text>
                  <Text style={[s.miniCardVal, { color:C.green, fontSize:24 }]}>R{insurance.totalCashback.toLocaleString()}</Text>
                  <Text style={s.miniCardSub}>Expected by {insurance.policies[0]?.cashbackDate}</Text>
                </View>
                <View style={{ alignItems:'center' }}>
                  <Text style={{ fontSize:32 }}>💸</Text>
                  <StatusPill label="Pending" color={C.amber} />
                </View>
              </View>
            </Card>

            {/* Policy cards */}
            {insurance.policies.map((policy,i) => (
              <Card key={i} style={{ marginBottom:10 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <View>
                    <Text style={s.cardTitle}>{policy.product}</Text>
                    <Text style={s.miniCardSub}>{policy.insurer}</Text>
                  </View>
                  <StatusPill label="Active" color={C.green} />
                </View>
                <View style={{ flexDirection:'row', gap:10 }}>
                  <View style={{ flex:1, backgroundColor:C.lightBg, borderRadius:10, padding:10 }}>
                    <Text style={s.miniCardLabel}>Monthly premium</Text>
                    <Text style={[s.miniCardVal, { color:C.textDark, fontSize:16 }]}>R{policy.premium}/mo</Text>
                  </View>
                  <View style={{ flex:1, backgroundColor:C.green+'12', borderRadius:10, padding:10 }}>
                    <Text style={s.miniCardLabel}>Cashback</Text>
                    <Text style={[s.miniCardVal, { color:C.green, fontSize:16 }]}>R{policy.cashback}</Text>
                  </View>
                </View>
                <View style={{ marginTop:10, flexDirection:'row', justifyContent:'space-between' }}>
                  <Text style={s.miniCardSub}>Next debit: {insurance.nextDebit}</Text>
                  <Text style={s.miniCardSub}>Renewal: {insurance.renewalDate}</Text>
                </View>
              </Card>
            ))}

            {/* Total */}
            <Card style={{ marginBottom:16 }}>
              <DetailRow label="Total monthly premium" value={`R${insurance.totalPremium}/mo`} />
              <DetailRow label="Total cashback due"    value={`R${insurance.totalCashback}`} valueColor={C.green} />
              <DetailRow label="Next debit date"       value={insurance.nextDebit} />
              <DetailRow label="Policy renewal"        value={insurance.renewalDate} last />
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — MUḼO TELEMATICS
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity onPress={() => setExpandTelematics(p=>!p)} activeOpacity={0.8}>
          <SectionHeader emoji="🚗" title="Muḽo Telematics"
            subtitle={`Drive Score ${telematics.driveScore}/100 · ${telematics.scoreBand} · Saving ${telematics.premiumSaving}% on insurance`}
            color={C.amber} />
        </TouchableOpacity>

        {expandTelematics && (
          <>
            {/* Drive Score card */}
            <Card style={{ marginBottom:10 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:16 }}>
                {/* Score ring */}
                <View style={[s.scoreRing, { borderColor:C.teal }]}>
                  <Text style={[s.scoreNum, { color:C.teal }]}>{telematics.driveScore}</Text>
                  <Text style={s.scoreLabel}>/ 100</Text>
                  <Text style={[s.scoreBand, { color:C.teal }]}>{telematics.scoreBand}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.cardTitle}>Muḽo Drive Score</Text>
                  <Text style={s.miniCardSub}>{telematics.tripCount} trips · {telematics.totalKm.toLocaleString()} km</Text>
                  <View style={[s.statusPill, { backgroundColor:C.green+'18', borderColor:C.green+'33', marginTop:8, alignSelf:'flex-start' }]}>
                    <Text style={{ fontSize:11, color:C.green, fontWeight:'700' }}>
                      💚 Saving {telematics.premiumSaving}% on car insurance
                    </Text>
                  </View>
                  <Text style={{ fontSize:10, color:C.textMid, marginTop:4 }}>
                    Tracker: {telematics.trackerSource}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Vehicle health */}
            <Card style={{ marginBottom:10 }}>
              <Text style={s.cardTitle}>Vehicle health</Text>
              <View style={{ marginTop:10, gap:10 }}>
                {[
                  { icon:'🔧', label:'Next service',   value:`${telematics.serviceKm.toLocaleString()} km away`, color:C.teal,  pct:(1-(telematics.serviceKm/15000))*100 },
                  { icon:'🔋', label:'Battery health',  value:`${telematics.batteryHealth}/100 · ${telematics.batteryRisk} risk`, color:telematics.batteryHealth>70?C.green:C.amber, pct:telematics.batteryHealth },
                  { icon:'⚫', label:'Tyre wear',       value:`${telematics.tyreWear}% worn`,  color:telematics.tyreWear<50?C.green:C.amber, pct:telematics.tyreWear },
                  { icon:'🛑', label:'Brake pads',      value:`${telematics.brakeWear}% worn`, color:telematics.brakeWear<50?C.green:C.amber, pct:telematics.brakeWear },
                ].map((item,i) => (
                  <View key={i} style={{ marginBottom:i<3?10:0 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                        <Text style={{ fontSize:16 }}>{item.icon}</Text>
                        <Text style={{ fontSize:13, color:C.textDark, fontWeight:'500' }}>{item.label}</Text>
                      </View>
                      <Text style={{ fontSize:12, color:item.color, fontWeight:'600' }}>{item.value}</Text>
                    </View>
                    <MiniBar pct={item.pct} color={item.color} />
                  </View>
                ))}
              </View>
            </Card>

            {/* Insurance impact */}
            <Card style={{ marginBottom:16, backgroundColor:C.teal+'12', borderWidth:1, borderColor:C.teal+'33' }}>
              <Text style={[s.cardTitle, { marginBottom:6 }]}>Telematics insurance impact</Text>
              <Text style={{ fontSize:13, color:C.textMid, lineHeight:20 }}>
                Your Gold Drive Score is saving you <Text style={{ color:C.green, fontWeight:'700' }}>R{Math.round(689*0.09)}/month</Text> on your Naked Insurance car premium. Keep driving safely to maintain your Gold band.
              </Text>
            </Card>
          </>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View style={{ alignItems:'center', paddingTop:8 }}>
          <Text style={{ fontSize:11, color:C.textLight }}>
            Muḽo Financial Technologies (Pty) Ltd · NCR Registered · POPIA Compliant
          </Text>
          <Text style={{ fontSize:11, color:C.textLight, marginTop:2 }}>
            Muḽo Financial Services (Pty) Ltd · FSP 49169
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header:            { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingTop:8, borderBottomWidth:1, borderBottomColor:C.border },
  logo:              { fontSize:24, fontWeight:'800', color:C.white },
  headerSub:         { fontSize:11, color:C.muted, marginTop:2 },
  avatar:            { width:40, height:40, borderRadius:14, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  avatarText:        { fontSize:14, fontWeight:'700', color:C.white },
  greetingStrip:     { flexDirection:'row', alignItems:'center', padding:16, backgroundColor:C.navyMid, gap:12 },
  greeting:          { fontSize:15, fontWeight:'700', color:C.white },
  greetingSub:       { fontSize:12, color:C.muted, marginTop:2 },
  quickStats:        { flexDirection:'row', backgroundColor:C.navyLight, borderBottomWidth:1, borderBottomColor:C.border },
  quickStat:         { flex:1, padding:12, alignItems:'center', borderRightWidth:1, borderRightColor:C.border },
  quickStatVal:      { fontSize:14, fontWeight:'800', marginBottom:2 },
  quickStatLabel:    { fontSize:9, color:C.muted, textAlign:'center' },
  sectionHeader:     { borderLeftWidth:3, paddingLeft:12, marginBottom:10, marginTop:4 },
  sectionHeaderTitle:{ fontSize:15, fontWeight:'700', color:C.textDark },
  sectionHeaderSub:  { fontSize:11, color:C.textMid, marginTop:2 },
  card:              { backgroundColor:C.cardBg, borderRadius:14, padding:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  cardTitle:         { fontSize:13, fontWeight:'700', color:C.textDark },
  statusPill:        { flexDirection:'row', alignItems:'center', gap:5, borderRadius:20, paddingHorizontal:10, paddingVertical:4, borderWidth:1, alignSelf:'flex-start' },
  statusDot:         { width:5, height:5, borderRadius:3 },
  statusPillText:    { fontSize:10, fontWeight:'700' },
  miniCardLabel:     { fontSize:10, color:C.textMid, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  miniCardVal:       { fontSize:20, fontWeight:'800', color:C.textDark, marginBottom:2 },
  miniCardSub:       { fontSize:11, color:C.textMid },
  miniBarTrack:      { height:4, backgroundColor:'#E8EDF4', borderRadius:2, overflow:'hidden' },
  miniBarFill:       { height:4, borderRadius:2 },
  progressLabel:     { fontSize:9, color:C.textLight, textTransform:'uppercase', letterSpacing:0.3 },
  detailRow:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10, marginBottom:10, borderBottomWidth:1, borderBottomColor:'#F0F4F8' },
  detailLabel:       { fontSize:13, color:C.textMid },
  detailValue:       { fontSize:13, fontWeight:'600', color:C.textDark },
  debtRow:           { flexDirection:'row', alignItems:'center', gap:10, paddingBottom:10, marginBottom:10, borderBottomWidth:1, borderBottomColor:'#F0F4F8' },
  debtIcon:          { width:28, height:28, borderRadius:14, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  debtName:          { fontSize:13, fontWeight:'500', color:C.textDark },
  debtDate:          { fontSize:11, color:C.textMid, marginTop:1 },
  debtAmt:           { fontSize:13, fontWeight:'700', color:C.textDark },
  debtStatus:        { fontSize:10, fontWeight:'600', textTransform:'capitalize', marginTop:1 },
  scoreRing:         { width:80, height:80, borderRadius:40, borderWidth:4, alignItems:'center', justifyContent:'center' },
  scoreNum:          { fontSize:24, fontWeight:'800' },
  scoreLabel:        { fontSize:9, color:C.textMid },
  scoreBand:         { fontSize:11, fontWeight:'700', marginTop:1 },
  textDark:          C.textDark,
  textMid:           C.textMid,
})
