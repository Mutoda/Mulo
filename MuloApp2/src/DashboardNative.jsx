/**
 * Muḽo Dashboard — DashboardNative.jsx
 * Faithful port of web Dashboard component to React Native
 * Shows: header, status card, repayment card, insights, savings chart,
 * recent activity, profile tab, loan details
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
  teal:      '#00B8A9',
  green:     '#1DB97A',
  white:     '#FFFFFF',
  muted:     'rgba(255,255,255,0.55)',
  subtle:    'rgba(255,255,255,0.08)',
  border:    'rgba(255,255,255,0.12)',
  danger:    '#FF5C5C',
  blue:      '#1A73E8',
  lightBg:   '#F0F4F8',
  cardBg:    '#FFFFFF',
  textDark:  '#0A1628',
  textMid:   '#8FA3BE',
  textLight: '#C5D0DC',
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO = {
  firstName:   'Thabo',
  lastName:    'Nkosi',
  loanAmount:  517500,
  rate:        '11.25% p.a. (Prime − 0.5%)',
  term:        60,
  monthly:     7543,
  muloScore:   82,
  equity:      580000,
  saving:      4260,
  disbAccount: 'Absa ••• ••• 2847',
  status:      'Settlement in progress',
  statusPct:   60,
  nextRepay:   'R 6,940',
  nextRepayDate: 'Due 11 May 2026 · Month 1 of 60',
}

const ACTIVITY = [
  { icon:'💸', bg:'#FFF0F0', label:'Wesbank settlement',     date:'Apr 14 · Vehicle finance',   amt:'-R128,500', type:'debit'  },
  { icon:'🏦', bg:'#F0F4FF', label:'African Bank settled',   date:'Apr 13 · Personal loan',     amt:'-R125,000', type:'debit'  },
  { icon:'💳', bg:'#FFF8F0', label:'Capitec CC closed',      date:'Apr 12 · Credit card',       amt:'-R48,000',  type:'debit'  },
  { icon:'✅', bg:'#F0FFF8', label:'Loan disbursed',         date:'Apr 12 · Muḽo equity loan',  amt:'+R320,000', type:'credit' },
]

const SAVINGS_BARS = [18,32,45,60,75,90,100]
const BAR_YEARS    = ['Y1','Y2','Y3','Y4','Y5','Y6','Y7']

// ── Shared components ──────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <Text style={s.sectionTitle}>{children}</Text>
)

const DetailRow = ({ label, value, last=false }) => (
  <View style={[s.detailRow, last && { borderBottomWidth:0, marginBottom:0, paddingBottom:0 }]}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
)

const Card = ({ children, style }) => (
  <View style={[s.card, style]}>{children}</View>
)

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardNative({ firstName, lastName, onSignOut }) {
  const [tab, setTab] = useState('home')

  const fName = firstName || DEMO.firstName
  const lName = lastName  || DEMO.lastName
  const initials = (fName[0]||'T') + (lName[0]||'N')

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.navy }} edges={['top']}>
      {/* ── DARK HEADER ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Top bar */}
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => setTab('home')}>
            <Text style={s.logo}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('profile')} style={s.avatarBtn}>
            <Text style={s.avatarText}>{initials.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={s.greeting}>Good morning 👋</Text>
        <Text style={s.clientName}>{fName} {lName}</Text>

        {/* Status card */}
        <View style={s.statusCard}>
          <View style={s.statusTop}>
            <Text style={s.statusLabel}>{DEMO.status}</Text>
            <View style={s.statusBadge}>
              <View style={s.statusDot} />
              <Text style={s.statusBadgeText}>Live</Text>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width:`${DEMO.statusPct}%` }]} />
          </View>
          <View style={s.progressLabels}>
            {['Approved','Disbursed','Settling','Complete'].map(l => (
              <Text key={l} style={s.progressLabel}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Repayment card */}
        <View style={s.repayCard}>
          <Text style={s.repayLabel}>Next repayment</Text>
          <Text style={s.repayAmount}>{DEMO.nextRepay}</Text>
          <Text style={s.repayMeta}>{DEMO.nextRepayDate}</Text>
        </View>
      </View>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <View style={{ flex:1, backgroundColor:C.lightBg }}>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:32 }} showsVerticalScrollIndicator={false}>

          {tab === 'home' && (
            <>
              {/* Insight cards */}
              <View style={s.insightRow}>
                {[
                  { icon:'💰', val:`R${DEMO.saving.toLocaleString()}`, label:'Monthly saving',   color:C.green },
                  { icon:'📉', val:'11.25%',                           label:'Avg. rate',        color:C.blue  },
                  { icon:'🏡', val:'R580k',                            label:'Property equity',  color:C.navy  },
                  { icon:'🎯', val:`Score ${DEMO.muloScore}`,          label:'Muḽo rating',      color:C.teal  },
                ].map((item,i) => (
                  <View key={i} style={s.insightCard}>
                    <Text style={{ fontSize:20, marginBottom:4 }}>{item.icon}</Text>
                    <Text style={[s.insightVal, { color:item.color }]}>{item.val}</Text>
                    <Text style={s.insightLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* 5-year savings */}
              <Card style={{ marginBottom:12 }}>
                <SectionTitle>5-year savings projection</SectionTitle>
                <Text style={s.savingsAmt}>R 255,600</Text>
                <Text style={s.savingsSub}>Total saved over loan term vs current debt</Text>
                <View style={s.barsContainer}>
                  {SAVINGS_BARS.map((h,i) => (
                    <View key={i} style={s.barWrapper}>
                      <View style={[s.bar, {
                        height: (h/100) * 60,
                        backgroundColor: `rgba(0,184,169,${0.15+i*0.12})`,
                      }]} />
                    </View>
                  ))}
                </View>
                <View style={s.barLabels}>
                  {BAR_YEARS.map(y => <Text key={y} style={s.barLabel}>{y}</Text>)}
                </View>
              </Card>

              {/* Recent activity */}
              <Card style={{ marginBottom:8 }}>
                <SectionTitle>Recent activity</SectionTitle>
                {ACTIVITY.map((a,i) => (
                  <View key={i} style={[s.activityRow, i===ACTIVITY.length-1&&{ borderBottomWidth:0, marginBottom:0, paddingBottom:0 }]}>
                    <View style={[s.activityIcon, { backgroundColor:a.bg }]}>
                      <Text style={{ fontSize:15 }}>{a.icon}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={s.activityLabel}>{a.label}</Text>
                      <Text style={s.activityDate}>{a.date}</Text>
                    </View>
                    <Text style={[s.activityAmt, { color:a.type==='credit'?C.green:C.danger }]}>
                      {a.amt}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {tab === 'profile' && (
            <>
              {/* Profile header card */}
              <Card style={{ marginBottom:12 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <View style={s.profileAvatar}>
                    <Text style={s.profileAvatarText}>{initials.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[s.detailValue, { fontSize:16, marginBottom:2 }]}>{fName} {lName}</Text>
                    <Text style={s.detailLabel}>Verified homeowner · Muḽo client</Text>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:4 }}>
                      <View style={{ width:6, height:6, borderRadius:3, backgroundColor:C.green }} />
                      <Text style={{ fontSize:11, color:C.green, fontWeight:'600' }}>Active loan</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Personal details */}
              <Card style={{ marginBottom:12 }}>
                <SectionTitle>Personal details</SectionTitle>
                <DetailRow label="Full name"     value={`${fName} ${lName}`} />
                <DetailRow label="SA ID number"  value="83010123••••••" />
                <DetailRow label="Mobile"        value="+27 82* *** 222" />
                <DetailRow label="Email"         value="••••@gmail.com" />
                <DetailRow label="DHA verified"  value="✓ Confirmed" last />
              </Card>

              {/* Loan details */}
              <Card style={{ marginBottom:12 }}>
                <SectionTitle>Loan details</SectionTitle>
                <DetailRow label="Loan amount"          value={`R ${DEMO.loanAmount.toLocaleString()}`} />
                <DetailRow label="Interest rate"        value={DEMO.rate} />
                <DetailRow label="Term"                 value={`${DEMO.term} months`} />
                <DetailRow label="Monthly repayment"    value={`R ${DEMO.monthly.toLocaleString()}`} />
                <DetailRow label="Disbursement account" value={DEMO.disbAccount} />
                <DetailRow label="Muḽo Score"           value={`${DEMO.muloScore} / 100`} last />
              </Card>

              {/* Sign out */}
              <Card style={{ marginBottom:12 }}>
                <TouchableOpacity
                  onPress={onSignOut}
                  style={[s.signOutBtn]}
                >
                  <Text style={s.signOutText}>Sign out</Text>
                </TouchableOpacity>
                <Text style={s.versionText}>Muḽo v1.0 · NCR Registered · POPIA Compliant</Text>
              </Card>
            </>
          )}

        </ScrollView>
      </View>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <View style={s.miniNav}>
        {[
          { label:'Home',     emoji:'🏠', key:'home'    },
          { label:'Tranches', emoji:'💸', key:'tranches'},
          { label:'Insure',   emoji:'🛡️', key:'insure'  },
          { label:'Support',  emoji:'💬', key:'support' },
          { label:'Profile',  emoji:'👤', key:'profile' },
        ].map(item => (
          <TouchableOpacity key={item.key} onPress={() => setTab(item.key)} style={s.navTab}>
            <Text style={{ fontSize:20 }}>{item.emoji}</Text>
            <Text style={[s.navTabLabel, tab===item.key && { color:C.teal }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header:           { backgroundColor:C.navy, padding:20, paddingTop:8 },
  headerTop:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  logo:             { fontSize:22, fontWeight:'800', color:C.white },
  avatarBtn:        { width:40, height:40, borderRadius:14, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  avatarText:       { fontSize:15, fontWeight:'700', color:C.white },
  greeting:         { fontSize:13, color:C.muted, marginBottom:2 },
  clientName:       { fontSize:22, fontWeight:'800', color:C.white, marginBottom:14 },

  // Status card
  statusCard:       { backgroundColor:'rgba(255,255,255,0.08)', borderRadius:14, padding:14, marginBottom:10 },
  statusTop:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  statusLabel:      { fontSize:13, fontWeight:'600', color:C.white },
  statusBadge:      { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(29,185,122,0.2)', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  statusDot:        { width:6, height:6, borderRadius:3, backgroundColor:C.green },
  statusBadgeText:  { fontSize:11, color:C.green, fontWeight:'700' },
  progressTrack:    { height:4, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:2, overflow:'hidden', marginBottom:6 },
  progressFill:     { height:4, backgroundColor:C.teal, borderRadius:2 },
  progressLabels:   { flexDirection:'row', justifyContent:'space-between' },
  progressLabel:    { fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.5 },

  // Repayment card
  repayCard:        { backgroundColor:'rgba(255,255,255,0.08)', borderRadius:14, padding:14 },
  repayLabel:       { fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  repayAmount:      { fontSize:28, fontWeight:'800', color:C.white, marginBottom:2 },
  repayMeta:        { fontSize:12, color:C.muted },

  // Cards
  card:             { backgroundColor:C.cardBg, borderRadius:18, padding:18, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:12, elevation:2 },
  sectionTitle:     { fontSize:12, fontWeight:'700', color:C.textMid, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },

  // Insight row
  insightRow:       { flexDirection:'row', gap:8, marginBottom:12 },
  insightCard:      { flex:1, backgroundColor:C.cardBg, borderRadius:14, padding:12, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 },
  insightVal:       { fontSize:14, fontWeight:'800', marginBottom:2 },
  insightLabel:     { fontSize:9, color:C.textMid, textAlign:'center' },

  // Savings chart
  savingsAmt:       { fontSize:28, fontWeight:'800', color:C.green, marginBottom:4 },
  savingsSub:       { fontSize:12, color:C.textMid, marginBottom:14 },
  barsContainer:    { flexDirection:'row', alignItems:'flex-end', height:60, gap:4 },
  barWrapper:       { flex:1, justifyContent:'flex-end' },
  bar:              { borderRadius:4, width:'100%' },
  barLabels:        { flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  barLabel:         { fontSize:10, color:C.textLight },

  // Activity
  activityRow:      { flexDirection:'row', alignItems:'center', gap:12, paddingBottom:12, marginBottom:12, borderBottomWidth:1, borderBottomColor:'#F0F4F8' },
  activityIcon:     { width:38, height:38, borderRadius:10, alignItems:'center', justifyContent:'center' },
  activityLabel:    { fontSize:13, fontWeight:'600', color:C.textDark, marginBottom:2 },
  activityDate:     { fontSize:11, color:C.textMid },
  activityAmt:      { fontSize:13, fontWeight:'700' },

  // Detail rows
  detailRow:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:12, marginBottom:12, borderBottomWidth:1, borderBottomColor:'#F0F4F8' },
  detailLabel:      { fontSize:13, color:C.textMid },
  detailValue:      { fontSize:13, fontWeight:'600', color:C.textDark },

  // Profile
  profileAvatar:    { width:56, height:56, borderRadius:18, alignItems:'center', justifyContent:'center', backgroundColor:C.teal },
  profileAvatarText:{ fontSize:20, fontWeight:'800', color:C.white },

  // Sign out
  signOutBtn:       { borderWidth:1.5, borderColor:'#FF7043', borderRadius:12, padding:16, alignItems:'center', marginBottom:10 },
  signOutText:      { fontSize:15, fontWeight:'700', color:'#FF7043' },
  versionText:      { fontSize:11, color:C.textLight, textAlign:'center' },

  // Bottom nav
  miniNav:          { flexDirection:'row', backgroundColor:C.white, borderTopWidth:1, borderTopColor:'#E8EDF4', paddingBottom:8, paddingTop:8 },
  navTab:           { flex:1, alignItems:'center', justifyContent:'center', gap:3 },
  navTabLabel:      { fontSize:9, fontWeight:'600', color:C.textLight, textTransform:'uppercase', letterSpacing:0.3 },
})
