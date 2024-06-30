import { StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { View, Text, useThemeColor } from '@/components/Themed'
import React, { useState, useEffect, useContext } from 'react';
import Colors from '@/constants/Colors';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';
import { useGlobalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type messageProps = {
    goalId: string
  };

const GoalList = (props: messageProps) => {
    const router = useRouter();
    const navigation = useNavigation();
    const patientId  = props.goalId;
    const session = useContext(SessionContext);
    const role = useContext(SessionContext)?.role;
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);

    // Estados para los filtros
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [originalGoals, setOriginalGoals] = useState<any[]>([]);
    const [originalGoalsSaved, setOriginalGoalsSaved] = useState(false);
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [endDate, setEndDate] = useState(new Date());
    
    useEffect(() => {
        // Guarda las metas originales solo la primera vez que se cargan
        if (!originalGoalsSaved && goals.length > 0) {
            setOriginalGoals(goals);
            setOriginalGoalsSaved(true);
        }
    }, [goals, originalGoalsSaved]);
    const arrowColor = useThemeColor({ light: Colors.black, dark: Colors.white }, 'text');

    useEffect(() => {
        // Maneja la suscripción a los cambios de Patient en Firestore
        if (patientId) {
            const unsubscribe = firestore()
                .collection('Professionals')
                .doc(session?.docId)
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
        console.log(selectedGoalId);
        router.push({ pathname: '/GoalDetail', params: { selectedGoal: selectedGoalId, role: role ? role : "" } });
    };

    const handleAddGoal = () => {
        router.replace({ pathname: '/assingGoal', params: { patientId: patientId } });
        // navigation.navigate('assingGoal', { sessionDocId: patientId });
    };

    const handleDailyGoal = () => {
        console.log('daily register');
        router.push({ pathname: '/DailyGoal', params: { patientId: patientId } });
        console.log({ pathname: '/DailyGoal', params: { sessionDocId: patientId } });
    };

    const handleFilterPress = () => {
        setShowPopup(true);
        setShowBackdrop(true);
    };

    const handleCancel = () => {
        setShowPopup(false);
        setShowBackdrop(false);
        setError(false);
    };

    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleConfirm = () => {
        if (endDate < startDate) {
            setError(true);
            setErrorMessage("La fecha inicial debe ser anterior a la fecha final");
            return;
        }else{
            setError(false);
        }
        filterGoalsByDateRange(startDate, endDate);
        setShowPopup(false);
        setShowBackdrop(false);
    };

    const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date | undefined) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date | undefined) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const handleReset = () => {
        setShowPopup(false);
        setGoals(originalGoals);
        setShowBackdrop(false);
        setError(false);
    }

    const filterGoalsByDateRange = async (startDate: Date, endDate: Date) => {
        if (patientId) {
            setLoading(true);
            try {
                // Ajustar las fechas de inicio y fin para incluir la primera y última hora
                const adjustedStartDate = new Date(startDate);
                adjustedStartDate.setHours(0, 0, 0, 0);
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                
                // Filtrar las metas originales 
                const filteredGoals = originalGoals.filter(goal => {
                    const goalStartDate = goal.StartDate ? goal.StartDate.toDate() : undefined;
                    const goalEndDate = goal.Deadline ? goal.Deadline.toDate() : undefined;
                    const isWithinRange = (goalStartDate && goalEndDate) &&
                                          (goalStartDate <= adjustedEndDate) &&
                                          (goalEndDate >= adjustedStartDate);
                    return isWithinRange;
                });
                setGoals(filteredGoals);
            } catch (error) {
                console.error("Error filtering goals:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={arrowColor} />
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
                    <Text style={styles.dateTitle} >Fecha inicial</Text>
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
                    <Text style={styles.dateTitle} >Fecha final</Text>
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
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.buttonText}>Salir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.buttonText}>Aplicar</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleReset}>
                        <Text style={styles.buttonText}>Eliminar Filtros</Text>
                    </TouchableOpacity>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    )}
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
            {role === 'patient' && (
                <TouchableOpacity style={styles.registerDayButton} onPress={handleDailyGoal}>
                    <Icon name="create" size={24} color="white" />
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
        backgroundColor: Colors.backdrop,
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
    dateTitle: {
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.green,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    registerDayButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.green,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        paddingHorizontal: 20,
    },
    datePickerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderRadius: 5,
        borderColor: Colors.gray,
    },
    errorContainer: {
        position: 'absolute',
        top: 120,
        right: 170,
        backgroundColor: Colors.red,
        padding: 5,
        borderRadius: 5,
        marginTop: 10,
        maxWidth: 120,
    },
    errorText: {
        color: Colors.white,
        fontWeight: "bold",
    },
});