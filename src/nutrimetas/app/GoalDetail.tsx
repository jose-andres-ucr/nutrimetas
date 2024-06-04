import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';

interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

interface TypeData {
    Name: string;
}

interface ActionData {
    Name: string;
}

interface RubricData {
    Name: string;
}

interface AmountData {
    Value: string;
}

interface FrequencyData {
    Name: string;
}

interface PortionData {
    Name: string;
    Plural: string;
}

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
    TypeData?: TypeData;
    ActionData?: ActionData;
    RubricData?: RubricData;
    AmountData?: AmountData;
    FrequencyData?: FrequencyData;
    PortionData?: PortionData;
}

const GoalDetail = () => {
    const navigation = useNavigation();
    const { selectedGoal } = useGlobalSearchParams();
    const [goalData, setGoalData] = useState<GoalData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoalDetails = async () => {
            if (selectedGoal) {
                try {
                    const goalSnapshot = await firestore().collection('Goal').doc(selectedGoal.toString()).get();
                    const goalDoc = goalSnapshot.data();
                    if (goalDoc) {
                        const typePromise = firestore().collection('Type').doc(goalDoc.Type).get();
                        const actionPromise = firestore().collection('Action').doc(goalDoc.Action).get();
                        const rubricPromise = firestore().collection('Rubric').doc(goalDoc.Rubric).get();
                        const amountPromise = firestore().collection('Amount').doc(goalDoc.Amount).get();
                        const frequencyPromise = firestore().collection('Frequency').doc(goalDoc.Frequency).get();
                        const portionPromise = firestore().collection('Portion').doc(goalDoc.Portion).get();

                        const [typeData, actionData, rubricData, amountData, frequencyData, portionData] = await Promise.all([
                            typePromise,
                            actionPromise,
                            rubricPromise,
                            amountPromise,
                            frequencyPromise,
                            portionPromise
                        ]);

                        setGoalData({
                            ...goalDoc,
                            TypeData: typeData.data(),
                            ActionData: actionData.data(),
                            RubricData: rubricData.data(),
                            AmountData: amountData.data(),
                            FrequencyData: frequencyData.data(),
                            PortionData: portionData.data()
                        } as GoalData);
                    } else {
                        console.error('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching goal details:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchGoalDetails();
    }, [selectedGoal]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    if (!goalData) {
        return <Text>No se encontraron detalles para esta meta.</Text>;
    }

    const { TypeData, ActionData, RubricData, AmountData, FrequencyData, PortionData } = goalData;
    const portionText = AmountData?.Value === '1' ? PortionData?.Name : PortionData?.Plural;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalles</Text>
            </View>
            <View style={styles.detailContainer}>
                <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Tipo: </Text>
                    {TypeData?.Name} {ActionData?.Name} {RubricData?.Name}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Cantidad: </Text>
                    {AmountData?.Value} {portionText} {FrequencyData?.Name}
                </Text>
            </View>
        </View>
    );
};

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
        marginVertical: 25,
    },
    boldText: {
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
    },
});
