import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalSearchParams } from 'expo-router';
import ShowComment from './showComment';

// Define the Timestamp interface
interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

// Define the GoalData interface
interface GoalData {
    Action: string;
    Amount: string;
    Deadline: Timestamp;
    Frequency: string;
    NotificationTime: Timestamp;
    Portion: string;
    Rubric: string;
    StartDate: Timestamp;
    Type: string;
    title?: string;
    description?: string;
}

const GoalDetail = () => {
    const navigation = useNavigation();
    const { selectedGoal, role } = useGlobalSearchParams();
    const [goalData, setGoalData] = useState<GoalData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedGoal) {
            const unsubscribe = firestore()
                .collection('Goal')
                .doc(selectedGoal.toString())
                .onSnapshot((snapshot) => {
                    const goalDoc = snapshot.data();
                    if (goalDoc) {
                        console.log(goalDoc);
                        setGoalData(goalDoc as GoalData);
                        setLoading(false);
                    } else {
                        console.error('No such document!');
                    }

                });

            return () => unsubscribe();
        } else {
            // console.error('patientId is undefined');
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <Text>Cargando...</Text>;
    }

    if (!goalData) {
        return <Text>No se encontraron detalles para esta meta.</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalles</Text>
            </View>
            <View style={styles.detailContainer}>
                <Text style={styles.detailText}>Tipo: {goalData.title}</Text>
                <Text style={styles.detailText}>Cantidad: {goalData.description}</Text>
            </View>
            <View style={styles.commentsContainer}>
                <ShowComment role={role as string} goalId= {selectedGoal as string}/>
            </View>
        </SafeAreaView>
    );
}

/*              <Text style={styles.detailText}>Acción: {goalData.Action}</Text>
                <Text style={styles.detailText}>Cantidad: {goalData.Amount}</Text>
                <Text style={styles.detailText}>Fecha Límite: {new Date(goalData.Deadline.seconds * 1000).toLocaleDateString()}</Text>
                <Text style={styles.detailText}>Frecuencia: {goalData.Frequency}</Text>
                <Text style={styles.detailText}>Hora de Notificación: {new Date(goalData.NotificationTime.seconds * 1000).toLocaleTimeString()}</Text>
                <Text style={styles.detailText}>Porción: {goalData.Portion}</Text>
                <Text style={styles.detailText}>Rúbrica: {goalData.Rubric}</Text>
                <Text style={styles.detailText}>Fecha de Inicio: {new Date(goalData.StartDate.seconds * 1000).toLocaleDateString()}</Text>
                <Text style={styles.detailText}>Tipo: {goalData.Type}</Text>
*/

export default GoalDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
    },
    detailContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'baseline',
    },
    detailText: {
        fontSize: 17,
        fontWeight: 'bold',
        marginVertical: 25,
    },
    commentsContainer: {
        flex: 2,
        alignContent: 'flex-end',
    },
});
