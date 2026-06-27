import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { C } from '../../src/theme'

const TabIcon = ({ focused, label, emoji }) => (
  <View style={{ alignItems:'center', justifyContent:'center', paddingTop:4, width:66 }}>
    <Text style={{ fontSize:18 }}>{emoji}</Text>
    <Text numberOfLines={1} style={{
      fontSize:9, fontWeight:focused?'700':'400',
      color:focused?C.teal:C.muted, marginTop:2,
    }}>{label}</Text>
  </View>
)

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown:false,
      tabBarStyle:{
        backgroundColor:'#0D1B2E',
        borderTopColor:'rgba(255,255,255,0.08)',
        borderTopWidth:1,
        height:72,
        paddingBottom:8,
      },
      tabBarShowLabel:false,
    }}>
      <Tabs.Screen name="index"     options={{ tabBarIcon:({focused})=><TabIcon focused={focused} label="Home"       emoji="🏠" /> }} />
      <Tabs.Screen name="refinance" options={{ tabBarIcon:({focused})=><TabIcon focused={focused} label="Refinance"  emoji="🏦" /> }} />
      <Tabs.Screen name="insure"    options={{ tabBarIcon:({focused})=><TabIcon focused={focused} label="Insure"     emoji="🛡️" /> }} />
      <Tabs.Screen name="vehicle"   options={{ tabBarIcon:({focused})=><TabIcon focused={focused} label="Telematics" emoji="🚗" /> }} />
      <Tabs.Screen name="profile"   options={{ tabBarIcon:({focused})=><TabIcon focused={focused} label="Dashboard"  emoji="📊" /> }} />
    </Tabs>
  )
}
