import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';
import { useGlobalSearchParams } from 'expo-router';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

const GoalList = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const { patientId } = useGlobalSearchParams();
    const { role } = useContext(SessionContext);
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCalendar, setShowCalendar] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");

    // estados para las fechas
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        if (patientId) {
            const unsubscribe = firestore()
                .collection('Patient')
                .doc(patientId.toString())
                .onSnapshot((snapshot) => {
                    const patientData = snapshot.data();
                    const patientGoals = patientData && patientData.Goals ? patientData.Goals : [];

                    if (patientGoals.length > 0) {
                        fetchGoalsFromFirebase(patientGoals);
                    } else {
                        setLoading(false);
                        console.log('El paciente no tiene metas.');
                    }
                });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [patientId]);

    const fetchGoalsFromFirebase = async (patientGoals: any) => {
        const goalsFromFirebase = [];

        for (const goalId of patientGoals) {
            if (typeof goalId.id === 'string') {
                const goalDoc = await firestore().collection('Goal').doc(goalId.id).get();
                const goalSelectId = goalDoc.id;
                if (goalDoc.exists) {
                    const goalData = goalDoc.data();
                    if (goalData) {
                        const title = await buildTitle(goalData.Rubric);
                        const description = await buildDescription(goalData);
                        goalsFromFirebase.push({ ...goalData, title, description, goalSelectId });
                    } else {
                        console.error('Goal data is undefined for goal ID:', goalId.id);
                    }
                }
            } else {
                console.error('Invalid goal ID:', goalId);
            }
        }

        setGoals(goalsFromFirebase);
        setLoading(false);
    };

    const buildTitle = async (rubricRef: string) => {
        try {
            const rubricDoc = await firestore().collection('Rubric').doc(rubricRef).get();
            if (rubricDoc.exists) {
                const rubricData = rubricDoc.data();
                if (rubricData && rubricData.Name) {
                    return rubricData.Name;
                } else {
                    throw new Error('Rubric data or Name is missing');
                }
            } else {
                throw new Error('Rubric document does not exist');
            }
        } catch (error) {
            console.error('Error fetching rubric:', error);
            return 'Meta';
        }
    };

    const fetchReferenceData = async (collection: string, docId: string) => {
        const doc = await firestore().collection(collection).doc(docId).get();
        return doc.exists ? doc.data() : null;
    };

    const buildDescription = async (goalData: any) => {
        try {
            const [typeData, actionData, rubricData, amountData, portionData, frequencyData] = await Promise.all([
                fetchReferenceData('Type', goalData.Type),
                fetchReferenceData('Action', goalData.Action),
                fetchReferenceData('Rubric', goalData.Rubric),
                fetchReferenceData('Amount', goalData.Amount),
                fetchReferenceData('Portion', goalData.Portion),
                fetchReferenceData('Frequency', goalData.Frequency),
            ]);

            if (!typeData || !actionData || !rubricData || !amountData || !portionData || !frequencyData) {
                console.error('Missing data for building description');
                return '';
            }

            let typePrefix;
            if (typeData.Name === 'Aumentar' || typeData.Name === 'Disminuir') {
                typePrefix = 'a';
            } else {
                typePrefix = 'en';
            }

            const portionName = amountData.Value === 1 ? portionData.Name : portionData.Plural;
            return `${typeData.Name} ${actionData.Name} ${rubricData.Name} ${typePrefix} ${amountData.Value} ${portionName} ${frequencyData.Name}`;
        } catch (error) {
            console.error('Error building description:', error);
            return '';
        }
    };

    const onPressHandle = (selectedGoalId: string) => {
        console.log(selectedGoalId);
        router.push({ pathname: '/GoalDetail', params: { selectedGoal: selectedGoalId } });
    };

    const handleAddGoal = () => {
        navigation.navigate('assingGoal', { sessionDocId: patientId });
    };

    const handleFilterPress = () => {
        console.log('Icono de filtro presionado');
        setShowPopup(true);
    };

    const handleButtonPress = (option) => {
        console.log("Botón presionado:", option);
        setSelectedOption(option);
        setShowPopup(false);
    };

    const handleCancel = () => {
        console.log('Cancelar');
        setShowPopup(false);
    };

    const handleConfirm = () => {
        console.log('Confirmar');
        // Verificar las fechas 
        console.log('Fecha de Inicio:', startDate);
        console.log('Fecha Límite:', endDate);
        filterGoalsByDateRange();
        setShowPopup(false);
    };

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            console.log('Fecha de Inicio seleccionada:', selectedDate);
        }
    };

    const handleEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
            console.log('Fecha Límite seleccionada:', selectedDate);
        }
    };

    const filterGoalsByDateRange = async () => {
        if (patientId) {
            setLoading(true);
            
            // Realizar consulta para StartDate
            const startGoalsQuerySnapshot = await firestore()
                .collection('Goal')
                .where('PatientId', '==', patientId)
                .where('StartDate', '>=', startDate)
                .get();
    
            // Realizar consulta para Deadline
            const endGoalsQuerySnapshot = await firestore()
                .collection('Goal')
                .where('PatientId', '==', patientId)
                .where('Deadline', '<=', endDate)
                .get();
    
            // Combinar los resultados de ambas consultas
            const startGoals = startGoalsQuerySnapshot.docs.map(doc => doc.data());
            const endGoals = endGoalsQuerySnapshot.docs.map(doc => doc.data());
            const filteredGoals = startGoals.filter(goal => {
                return endGoals.some(endGoal => endGoal.id === goal.id);
            });
    
            setGoals(filteredGoals);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Metas</Text>
                <TouchableOpacity onPress={handleFilterPress} style={styles.filterContainer}>
                    <Image 
                        style={styles.filterImage} 
                        source={{ uri: 'https://icons-for-free.com/iff/png/512/filter-131979013401653166.png' }}
                    />
                </TouchableOpacity>
            </View>

            {/* Ventana emergente */}
            {showPopup && (
                <View style={styles.popupContainer}>
                    <Text>Fecha de Inicio</Text>
                    <TouchableOpacity style={styles.datePickerStyle} onPress={() => setShowStartDatePicker(true)}>
                        <Text>{startDate.toDateString()}</Text>
                        <FontAwesome name="calendar" size={24} color="gray" />
                    </TouchableOpacity>
                    {showStartDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={handleStartDateChange}
                        />
                    )}

                    <Text>Fecha Límite</Text>
                    <TouchableOpacity style={styles.datePickerStyle} onPress={() => setShowEndDatePicker(true)}>
                        <Text>{endDate.toDateString()}</Text>
                        <FontAwesome name="calendar" size={24} color="gray" />
                    </TouchableOpacity>
                    {showEndDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display="default"
                            onChange={handleEndDateChange}
                        />
                    )}

                    <TouchableOpacity style={styles.button} onPress={handleCancel}>
                        <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                        <Text style={styles.buttonText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <Text>Cargando...</Text>
            ) : goals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tiene metas pendientes.</Text>
                </View>
            ) : (
                <FlatList
                    data={goals}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onPressHandle(item.goalSelectId)}>
                            <View style={styles.item}>
                                <Image
                                    style={styles.itemImage}
                                    source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                                />
                                <View style={styles.goalDetails}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => `${item.title}-${index}`}
                />
            )}
            {role === 'professional' && (
                <TouchableOpacity style={styles.floatingButton} onPress={handleAddGoal}>
                    <Icon name="add" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default GoalList;

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    popupContainer: {
        position: 'absolute',
        backgroundColor: 'white',
        padding: 20,
        marginTop: '20%',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        height: '50%',
        top: '25%',
        left: '10%',
        zIndex: 999,
    },
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
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '2%',
        borderBottomWidth: 1
    },
    itemImage: {
        width: 60,
        height: 60,
        marginRight: 10,
    },
    filterContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 30,
        height: 25,
        marginTop: 8,
        marginRight: 8,
    },
    filterImage: {
        width: 30,
        height: 25,
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center'
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    datePickerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderRadius: 5,
        borderColor: 'gray',
    },
});
