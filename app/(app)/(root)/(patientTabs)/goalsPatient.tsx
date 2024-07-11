import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import GoalList from '@/app/(app)/(root)/GoalList';
import { useGlobalSearchParams } from 'expo-router';

export default function Goals() {
    const { patientId } = useGlobalSearchParams();
    
    return (
        <SafeAreaView style={styles.container}>
            <GoalList/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray,
    top: "-12%",
    marginBottom: "-22%",
  },
});