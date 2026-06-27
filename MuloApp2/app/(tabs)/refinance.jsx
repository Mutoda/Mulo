import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { C } from '../../src/theme'

export default function RefinanceScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.logo}>Mu<Text style={{ color:C.teal }}>ḽ</Text>o</Text>
        <Text style={s.sub}>Refinance</Text>
      </View>
      <View style={s.body}>
        <Text style={{ fontSize:40, marginBottom:16 }}>🏦</Text>
        <Text style={s.title}>Muḽo Refinance</Text>
        <Text style={s.desc}>
          Access equity in your property to consolidate expensive debt at a lower rate — fully digital, no branch visit required.
        </Text>
        <TouchableOpacity style={s.btn}>
          <Text style={s.btnText}>Start my application →</Text>
        </TouchableOpacity>
        <Text style={s.note}>NCR Registered · POPIA Compliant · Powered by Muḽo Financial Technologies</Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:C.navy },
  header:    { padding:20, paddingTop:8, borderBottomWidth:1, borderBottomColor:C.border },
  logo:      { fontSize:24, fontWeight:'800', color:C.white },
  sub:       { fontSize:11, color:C.muted, marginTop:2 },
  body:      { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  title:     { fontSize:24, fontWeight:'800', color:C.white, marginBottom:12, textAlign:'center' },
  desc:      { fontSize:14, color:C.muted, lineHeight:22, textAlign:'center', marginBottom:32 },
  btn:       { backgroundColor:C.green, borderRadius:14, padding:18, width:'100%', alignItems:'center', marginBottom:16 },
  btnText:   { fontSize:15, fontWeight:'700', color:C.navy },
  note:      { fontSize:11, color:C.muted, textAlign:'center', lineHeight:18 },
})
