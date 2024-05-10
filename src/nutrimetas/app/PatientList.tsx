import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image  } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { router } from "expo-router";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { successfulSelection } from './Notifications';
import { useNavigation } from '@react-navigation/native';

const PatientList = () => {
  const navigation = useNavigation();
  const [patients, setPatients] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);


  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Patient')
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setPatients(data);
      });

    return () => unsubscribe();
  }, []);

  const onPressHandle = async (selectedPatient: any) => {
    const goalsData = [];

    if (selectedPatient.Goals && selectedPatient.Goals.length > 0) {
        for (const goalRef of selectedPatient.Goals) {
            try {
                const GoalDoc = await goalRef.get();
                const goalData = GoalDoc.data();
                if (goalData) {
                    goalsData.push(goalData);
                }
            } catch (error) {
                console.error('Error fetching goal:', error);
            }
        }
    }
   
    setGoals(goalsData);
    console.log('Selected Patient:',selectedPatient.name)
    console.log('Profesional ID:', selectedPatient.assignedProfessionalId); 
    navigation.navigate('PatientGoals', { name: selectedPatient.name });
};

return (
    <FlatList
        data={patients}
        renderItem={({ item }) => (
            //<TouchableOpacity onPress={() => successfulSelection()}>
              <TouchableOpacity onPress={() => onPressHandle(item)}>
                <View style={styles.item}>
                    <Image
                        style={styles.itemImage}
                        source={{uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'}}
                    />
                    <Text style={styles.itemName}> {item.name} </Text>
                </View>
                <FlashMessage position="top" />
            </TouchableOpacity>
        )}
        keyExtractor={(item) => item.phone}
    />
  );
}

export default PatientList

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '2%',
        borderBottomWidth: 1
    },
    itemImage: {
       width: 60,
       height: 60 
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16
    }
})