import { Link } from "expo-router";
import { SafeAreaView, View, StyleSheet, Text } from "react-native";
import Colors from "@/constants/Colors";
import ShowComments from '@/app/(app)/(root)/showComment';

export default function Comments() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
          <ShowComments role={'professional'} goalId={'0s8C1yvI81TcmWi6PFgX'} />
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
      top: -55,
    },
    addButton: {
      backgroundColor: Colors.lightblue,
      fontWeight: "bold",
      width: '100%',
      height: 55,
      position: "absolute",
      bottom: 0,
      justifyContent: "center",
      textAlign: 'center',
      color: Colors.white,
      fontSize: 16,
      lineHeight: 50
    },
  });