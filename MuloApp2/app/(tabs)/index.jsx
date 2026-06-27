import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { C } from '../../src/theme'

export default function HomeScreen() {
  const router = useRouter()
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.logo}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
          <Text style={s.tagline}>Your financial home</Text>
        </View>
        <View style={s.fsp}><Text style={s.fspText}>FSP 49169</Text></View>
      </View>
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
        <View style={s.welcomeCard}>
          <Text style={s.welcomeTitle}>Welcome to Muḽo 👋</Text>
          <Text style={s.welcomeSub}>Access your home equity, compare insurance and monitor your vehicle health — all in one place.</Text>
        </View>
        {[
          { emoji:'🏦', title:'Muḽo Refinance',  sub:'Access equity in your property to settle expensive debt', color:C.teal,  tag:'Refinancing', route:'/refinance' },
          { emoji:'🛡️', title:'Muḽo Insure',     sub:'Compare & earn cashback on insurance',                   color:C.green, tag:'Insurance',   route:'/insure'    },
          { emoji:'🚗', title:'Muḽo Telematics', sub:'Vehicle health, Drive Score & insurance savings',         color:C.amber, tag:'Telematics',  route:'/vehicle'   },
        ].map((p,i) => (
          <TouchableOpacity key={i} style={[s.productCard,{borderColor:p.color+'44'}]}
            activeOpacity={0.8} onPress={()=>router.push(p.route)}>
            <View style={[s.productIcon,{backgroundColor:p.color+'18'}]}>
              <Text style={{ fontSize:28 }}>{p.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
                <Text style={s.productTitle}>{p.title}</Text>
                <View style={[s.badge,{backgroundColor:p.color+'22',borderColor:p.color+'44'}]}>
                  <Text style={[s.badgeText,{color:p.color}]}>{p.tag}</Text>
                </View>
              </View>
              <Text style={s.productSub}>{p.sub}</Text>
            </View>
            <Text style={{ color:C.muted, fontSize:18 }}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={s.trustStrip}>
          {[['🛡️','FSP 49169'],['🔒','POPIA'],['🏦','NCR Registered']].map(([icon,label])=>(
            <View key={label} style={s.trustItem}>
              <Text style={{ fontSize:14 }}>{icon}</Text>
              <Text style={s.trustText}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.navy },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingTop:56, borderBottomWidth:1, borderBottomColor:C.border },
  logo:         { fontSize:28, fontWeight:'800', color:C.white },
  tagline:      { fontSize:11, color:C.muted, marginTop:2 },
  fsp:          { backgroundColor:C.subtle, borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  fspText:      { fontSize:11, color:C.muted, fontWeight:'600' },
  welcomeCard:  { backgroundColor:C.navyLight, borderRadius:14, padding:18, marginBottom:16, borderWidth:1, borderColor:C.border },
  welcomeTitle: { fontSize:17, fontWeight:'700', color:C.white, marginBottom:6 },
  welcomeSub:   { fontSize:13, color:C.muted, lineHeight:20 },
  productCard:  { backgroundColor:C.navyLight, borderRadius:14, padding:16, marginBottom:12, borderWidth:1, flexDirection:'row', alignItems:'center', gap:14 },
  productIcon:  { width:52, height:52, borderRadius:12, alignItems:'center', justifyContent:'center' },
  productTitle: { fontSize:15, fontWeight:'700', color:C.white },
  productSub:   { fontSize:12, color:C.muted, marginTop:2 },
  badge:        { borderRadius:20, paddingHorizontal:8, paddingVertical:2, borderWidth:1 },
  badgeText:    { fontSize:10, fontWeight:'700' },
  trustStrip:   { flexDirection:'row', justifyContent:'space-around', marginTop:8, paddingTop:20, borderTopWidth:1, borderTopColor:C.border },
  trustItem:    { alignItems:'center', gap:4 },
  trustText:    { fontSize:10, color:C.muted, fontWeight:'600' },
})
