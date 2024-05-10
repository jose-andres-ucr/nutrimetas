import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoute } from '@react-navigation/native';

const GoalList = () => {
    const route = useRoute();
    const patientId = route.params?.selectedPatientId;
    const [goals, setGoals] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Patient')
            .doc(patientId)
            .onSnapshot((snapshot) => {
                const patientData = snapshot.data();
                const patientGoals = patientData && patientData.Goals ? patientData.Goals : [];

                if (patientGoals.length > 0) {
                    fetchGoalsFromFirebase(patientGoals);
                } else {
                    // Aquí puedes manejar el caso en que no hay objetivos para el paciente
                    console.log('El paciente no tiene objetivos.');
                }
            });

        return () => unsubscribe();
    }, [patientId]);

    const fetchGoalsFromFirebase = async (patientGoals) => {
        const goalsFromFirebase = [];

        for (const goalId of patientGoals) {
            // Verificar si goalId es una cadena (ID de objetivo)
            if (typeof goalId.id === 'string') {
                const goalDoc = await firestore().collection('Goal').doc(goalId.id).get();
                if (goalDoc.exists) {
                    goalsFromFirebase.push(goalDoc.data());
                }
            } else {
                console.error('Invalid goal ID:', goalId);
            }
        }

        setGoals(goalsFromFirebase);
    };

    const getDescription = (goal: any) => {
        return `${goal.Description} a ${goal.Frequency} veces, ${goal.Modality}`;
    };

    const onPressHandle = (selectedGoal: any) => {
        console.log(selectedGoal);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Metas</Text>
            <FlatList
                data={goals}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandle(item)}>
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                            />
                            <View style={styles.goalDetails}>
                                <Text style={styles.itemTitle}>{item.Title}</Text>
                                <Text style={styles.itemDescription}>{getDescription(item)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
}

export default GoalList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '2%',
        borderBottomWidth: 1
    },
    itemImage: {
        width: 60,
        height: 60,
        marginRight: 10
    },
    goalDetails: {
        flex: 1
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16
    },
    itemDescription: {
        fontSize: 14
    }
});
