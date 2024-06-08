import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { View, Text, TextProps, useThemeColor } from '@/components/Themed'
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/Colors';
import ShowComment from './showComment';

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

const fetchGoalDetails = async (selectedGoal: string) => {
    const goalSnapshot = await firestore().collection('Goal').doc(selectedGoal).get();
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

        return {
            ...goalDoc,
            TypeData: typeData.data(),
            ActionData: actionData.data(),
            RubricData: rubricData.data(),
            AmountData: amountData.data(),
            FrequencyData: frequencyData.data(),
            PortionData: portionData.data()
        } as GoalData;
    } else {
        throw new Error('No such document!');
    }
};

const formatDate = (timestamp: Timestamp) => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const GoalDetail = () => {
    const navigation = useNavigation();
    const { selectedGoal, role } = useGlobalSearchParams();
    const arrowColor = useThemeColor({ light: Colors.black, dark: Colors.white }, 'text');

    const { data: goalData, error, isLoading } = useQuery({
        queryKey: ['goalDetails', selectedGoal],
        queryFn: () => fetchGoalDetails(selectedGoal.toString()),
        enabled: !!selectedGoal, // Only run the query if selectedGoal is defined
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    if (error) {
        return <Text>Error cargando detalles de la meta.</Text>;
    }

    if (!goalData) {
        return <Text>No se encontraron detalles para esta meta.</Text>;
    }

    const { TypeData, ActionData, RubricData, AmountData, FrequencyData, PortionData, StartDate, Deadline } = goalData;
    const portionText = AmountData?.Value === '1' ? PortionData?.Name : PortionData?.Plural;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={arrowColor} />
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
                <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Fecha de inicio: </Text>
                    {formatDate(StartDate)}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Fecha límite: </Text>
                    {formatDate(Deadline)}
                </Text>
            </View>
            <View style={styles.commentsContainer}>
                <ShowComment role={role as string} goalId={selectedGoal as string} />
            </View>
        </SafeAreaView>
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
        marginVertical: 22,
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
    commentsContainer: {
        flex: 2,
        alignContent: 'flex-end',
    },
});
