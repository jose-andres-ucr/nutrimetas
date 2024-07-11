import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import ProfessionalList from '../ProfessionalList';

export default function Transferencias() {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
            <ProfessionalList/> 
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: Colors.white
  },
  listContainer: {
    paddingHorizontal: 20,
    top: -10,
  },
});