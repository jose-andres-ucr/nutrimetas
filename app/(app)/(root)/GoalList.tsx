import { StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { View, Text, useThemeColor } from '@/components/Themed'
import React, { useState, useEffect, useContext } from 'react';
import Colors from '@/constants/Colors';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/Session/LoginSessionProvider';
import { useGlobalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { scheduleNotification } from '@/shared/Notifications/notification';
import * as Notifications from 'expo-notifications';

const images = {
    carne: require('@/assets/images/carnes.png'),
    fruta: require('@/assets/images/frutas.png'),
    actividadFisica: require('@/assets/images/actividadFisica.png'),
    agua: require('@/assets/images/agua.png'),
    cafe: require('@/assets/images/cafe.png'),
    harinas: require('@/assets/images/harinas.png'),
    lacteos: require('@/assets/images/lacteos.png'),
    vegetales: require('@/assets/images/vegetales.png'),
}


const GoalList = () => {
    const [errorVisible, setErrorVisible] = useState(false);
    const router = useRouter();
    const navigation = useNavigation();

    // Sesión, rol e ID de la persona logueada
    const session = useContext(SessionContext);
    const userDocID = session && session.state === "valid" ? 
        session.userData.docId : undefined;

    // Rol de la persona logueada
    const role = session && session.state === "valid" ? session.userData.role : undefined;

    // ID del profesional (o profesional asignado)
    const profDocID = session && session.state === "valid" ? (
        session.userData.role === "professional" ? userDocID :
        session.userData.role === "patient" ? session.userData.assignedProfDocId : 
        undefined
    ) : undefined;

    // ID del paciente (o paciente asignado)
    const { patientId : paramPatientID } = useGlobalSearchParams();
    const patientDocID = session && session.state === "valid" ? (
        session.userData.role === "professional" ? (
            paramPatientID ? paramPatientID.toString() : undefined
        ) :
        session.userData.role === "patient" ? session.userData.docId : 
        undefined
    ) : undefined;
    
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);

    console.log("Patient doc ID", patientDocID);
    console.log("Professional doc ID", profDocID);

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
        if (patientDocID) {
            const unsubscribe = firestore()
                .collection('Professionals')
                .doc(profDocID)
                .collection('Patient')
                .doc(patientDocID)
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
    }, [patientDocID, profDocID]);

    const getGoalById = (goalId: any) => {
        return goals.find(goal => goal.goalSelectId === goalId);
    };

    const fetchGoalsFromFirebase = async (patientGoals: any) => {
        const goalsFromFirebase = [];
        // Cancelar todas las notificaciones antes de programar nuevas
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const goalId of patientGoals) {
            if (typeof goalId.id === 'string') {
                const goalDoc = await firestore().collection('Goal').doc(goalId.id).get();
                const goalSelectId = goalDoc.id;
                if (goalDoc.exists) {
                    const goalData = goalDoc.data();
                    if (goalData) {
                        const title = await buildTitle(goalData.Rubric);
                        const description = await buildDescription(goalData);
                        if (role === 'patient') { // Notificar solo a los que se loguearon como paciente
                            scheduleDailyNotifications(goalData, description);
                        }
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
                    return rubricData.Name.charAt(0).toUpperCase() + rubricData.Name.slice(1);;
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


    const buildDescription = async (goalData: FirebaseFirestoreTypes.DocumentData) => {
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

    const scheduleDailyNotifications = async (goalData: FirebaseFirestoreTypes.DocumentData, description: string) => {
        if (goalData.NotificationTime && goalData.Deadline) {
            const startTime = new Date(goalData.NotificationTime.seconds * 1000);
            const endTime = new Date(goalData.Deadline.seconds * 1000);
            let currentDate = new Date(startTime);
            console.log(currentDate);
            while (currentDate <= endTime) {
                scheduleNotification('Recordatorio de Meta', description, currentDate);
                // Incrementa el día
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    };

    const onPressHandle = (selectedGoalId: string) => {
        router.push({ pathname: '/GoalDetail', params: { selectedGoal: selectedGoalId, role: role ? role : "" } });
    };

    const editGoal = (selectedGoalId: string) => {
        const selectedGoal = getGoalById(selectedGoalId);
        const serializedGoal = encodeURIComponent(JSON.stringify(selectedGoal));
        if (selectedGoal) {
            setErrorVisible(false);
            router.replace({ pathname: '/EditGoal', params: { serializedGoal: serializedGoal, GoalId: selectedGoalId, patientId: patientDocID ?? ""} });
        } else {
            setErrorVisible(true);
        }
    };

    const handleDeleteGoals = () => {
        router.replace({
            pathname: '/GoalDelete',
            params: { patientId: patientDocID ?? "" }
        })
        console.log("Eliminando");
    }

    const handleAddGoal = () => {
        router.replace({ pathname: '/assingGoal', params: { patientId: patientDocID ?? "" } });
    };

    const handleDailyGoal = () => {
        console.log('daily register');
        router.push({ pathname: '/DailyGoal', params: { patientId: patientDocID  ?? ""} });
        console.log({ pathname: '/DailyGoal', params: { sessionDocId: patientDocID } });
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
        } else {
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
        if (patientDocID) {
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

    const getImageSource = (rubric: string) => {
        const lowerCaseRubric = rubric.toLowerCase();
        switch (lowerCaseRubric) {
            case 'actividad física':
                return images.actividadFisica;
            case 'frutas':
                return images.fruta;
            case 'harinas':
                return images.harinas;
            case 'vegetales':
                return images.vegetales;
            case 'café':
                return images.cafe;
            case 'carnes rojas':
                return images.carne;
            case 'lácteos':
                return images.lacteos;
            case 'agua':
                return images.agua;
            default:
                return images.actividadFisica; // imagen por defecto
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
                {
                    router.canGoBack() ? (
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back" size={24} color={arrowColor} />
                        </TouchableOpacity>
                    ) : null
                }
                
                <Text style={styles.title}>Metas</Text>
                <TouchableOpacity onPress={handleFilterPress} style={styles.filterContainer}>
                    <Image
                        style={styles.filterImage}
                        source={{ uri: 'https://icons-for-free.com/iff/png/512/filter-131979013401653166.png' }}
                    />
                </TouchableOpacity>
                <TouchableOpacity>
                    {role === 'professional' && (
                        <View style={styles.deleteButtonContainer}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDeleteGoals}
                            >
                                <Icon name="trash" size={24} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            {showBackdrop && <View style={styles.backdrop} />}
            {/* Ventana emergente */}
            {showPopup && (
                <View style={styles.popupContainer}>
                    <View style={styles.filtersHeader}>
                        <Text style={styles.filterTitle}>Filtros</Text>
                    </View>
                    <Text style={styles.dateTitle}>Fecha inicial</Text>
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
                    <Text style={styles.dateTitle}>Fecha final</Text>
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
                                    source={getImageSource(item.title)}
                                />
                                <View style={styles.goalDetails}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                </View>
                                <View>
                                    {errorVisible && (
                                        <Text style={{ color: 'red', fontSize: 16 }}>
                                            Meta no encontrada. Por favor, selecciona una meta válida.
                                        </Text>
                                    )}
                                    {role == "professional" && <TouchableOpacity onPress={() => editGoal(item.goalSelectId)} style={styles.editIconContainer}>
                                        <Icon name="pencil" size={24} color="gray" />
                                    </TouchableOpacity>}
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
    editIcon: {
        padding: 8,
    },
    editIconContainer: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    deleteButtonContainer: {
        position: 'absolute',
        top: -15,
        left: 130,
        backgroundColor: Colors.red,
        padding: 5,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    selectedItem: {
        shadowColor: Colors.gray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
        backgroundColor: Colors.lightGray,
    },
});