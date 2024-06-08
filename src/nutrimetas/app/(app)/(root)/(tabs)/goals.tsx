import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import TemplatedGoals from '../templatedGoals';

export default function Goals() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.templateGoalList}>
        <TemplatedGoals />
      </View>
      <Link push href="/assingGoal" style={styles.button}>
            Crear Meta
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  button: {
    backgroundColor: Colors.lightblue,
    fontWeight: "bold",
    width: '100%',
    height: 50,
    position: "absolute",
    bottom: 0,
    justifyContent: "center",
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    lineHeight: 50
  },
  templateGoalList: {
    top: -50,
  }
});
