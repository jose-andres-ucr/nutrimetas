import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import Colors from '@/constants/Colors';
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
    const [showPopup, setShowPopup] = useState(false);

    // estados para las fechas
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [originalGoals, setOriginalGoals] = useState<any[]>([]);
    const [originalGoalsSaved, setOriginalGoalsSaved] = useState(false);
    const [showBackdrop, setShowBackdrop] = useState(false);

    useEffect(() => {
        // Guarda las metas originales solo la primera vez que se cargan
        if (!originalGoalsSaved && goals.length > 0) {
            setOriginalGoals(goals);
            setOriginalGoalsSaved(true);
        }
    }, [goals, originalGoalsSaved]);

    useEffect(() => {
        // Maneja la suscripción a los cambios de Patient en Firestore
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
                //console.log('Datos de la meta:', goalDoc.data());
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
        const data = doc.exists ? doc.data() : null;
        return data;
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
        //console.log(selectedGoalId);
        router.push({ pathname: '/GoalDetail', params: { selectedGoal: selectedGoalId } });
    };

    const handleAddGoal = () => {
        navigation.navigate('assingGoal', { sessionDocId: patientId });
    };

    const handleFilterPress = () => {
        setShowPopup(true);
        setShowBackdrop(true);
    };

    const handleCancel = () => {
        setShowPopup(false);
        setShowBackdrop(false);
    };

    const handleConfirm = () => {
        const formattedStartDate = startDate.toISOString();
    
        // Calcular la fecha final como 7 días después de la fecha de inicio
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        /*const formattedEndDate = endDate.toISOString();
        console.log('Fecha de Inicio:', formattedStartDate);
        console.log('Fecha Límite:', formattedEndDate); */
    
        filterGoalsByDateRange(startDate, endDate);
        setShowPopup(false);
        setShowBackdrop(false);
    };

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const handleReset = () => {
        setShowPopup(false);
        setGoals(originalGoals); // Restablece las metas a los valores originales
        setShowBackdrop(false);
    }

    const filterGoalsByDateRange = async (startDate, endDate) => {
        if (patientId) {
            setLoading(true);
            try {
                // Ajustar las fechas de inicio y fin para incluir la primera y última hora 
                const adjustedStartDate = new Date(startDate);
                adjustedStartDate.setHours(0, 0, 0, 0); 
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999); 
    
                // Filtrar las metas originales por las fechas ajustadas
                const filteredGoals = originalGoals.filter(goal => {
                    const goalStartDate = new Date(goal.StartDate.toDate());
                    return goalStartDate >= adjustedStartDate && goalStartDate <= adjustedEndDate;
                });
                setGoals(filteredGoals);
            } catch (error) {
                console.error("Error filtering goals:", error);
            } finally {
                setLoading(false);
            }
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
            {showBackdrop && <View style={styles.backdrop} />}
            {/* Ventana emergente */}
            {showPopup && (
                
                <View style={styles.popupContainer}>
                    <View style={styles.filtersHeader}>
                        <Text style={styles.filterTitle}>Filtros</Text>
                    </View>
                    <Text style={styles.dateTitle} >Fecha de Inicio</Text>
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
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.buttonText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleReset}>
                        <Text style={styles.buttonText}>Eliminar Filtros</Text>
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
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 998, 
    },
    popupContainer: {
        position: 'absolute',
        flex: 1,
        backgroundColor: Colors.white,
        padding: 20,
        marginTop: '20%',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        left: '45%', 
    },
    filtersHeader: {
        position: 'absolute',
        top: 10,
        left: 10,       
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
    },
    dateTitle:{
        marginTop: 10,
        marginBottom: -10,
    },
    button: {
        backgroundColor: Colors.lightblue,
        padding: 10,
        borderRadius: 5,
        marginTop: 10,    
    },
    buttonText: {
        color: Colors.white,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.red, 
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        marginRight: 5, 
    },
    confirmButton: {
        backgroundColor: Colors.green, 
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        marginLeft: 5, 
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