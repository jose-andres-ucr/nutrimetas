import { StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Text } from 'react-native';
import { View, useThemeColor } from '@/components/Themed';
import React, { useState, useEffect, useContext } from 'react';
import Colors from '@/constants/Colors';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/Session/LoginSessionProvider';
import { useGlobalSearchParams } from 'expo-router';
import { CheckBox } from 'react-native-elements';

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

const DailyGoal = () => {
    const [textInputValues, setTextInputValues] = useState<{ [key: string]: number }>({});
    const [selectedGoal, setSelectedGoal] = useState<{ [key: string]: boolean }>({});
    const router = useRouter();
    const navigation = useNavigation();

    // Sesión, rol e ID de la persona logueada
    const session = useContext(SessionContext);
    const userDocID = session && session.state === "valid" ? 
        session.userData.docId : undefined;


    // ID del profesional
    const profDocID = session && session.state === "valid" ? (
        session.userData.role === "professional" ? userDocID :
        session.userData.role === "patient" ? session.userData.assignedProfDocId : 
        undefined
    ) : undefined;

    // ID del paciente
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
    const arrowColor = useThemeColor({ light: Colors.black, dark: Colors.white }, 'text');

    useEffect(() => {
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
                        const description = await buildDailyGoal(goalData);
                        goalsFromFirebase.push({ ...goalData,  description, title, goalSelectId });
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


    const fetchReferenceData = async (collection: string, docId: string) => {
        const doc = await firestore().collection(collection).doc(docId).get();
        const data = doc.exists ? doc.data() : null;
        return data;
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
    const buildDailyGoal = async (goalData: any) => {
        try {
            const [rubricData, actionData, amountData, portionData] = await Promise.all([
                fetchReferenceData('Rubric', goalData.Rubric),
                fetchReferenceData('Action', goalData.Action),
                fetchReferenceData('Amount', goalData.Amount),
                fetchReferenceData('Portion', goalData.Portion),
            ]);

            if (!rubricData || !actionData || !amountData || !portionData) {
                return '';
            }

            const typePrefix = actionData.Name.includes('consumo') ? 'Consumiste' : 'Realizaste';
            const today = 'hoy?';
            const rubricName = rubricData.Name.toLowerCase();
            const portionName = amountData.Value === 1 ? portionData.Name.toLowerCase() : portionData.Plural.toLowerCase();
            const article = amountData.Value === 1 ? (portionData.Gender === 'M' ? 'un' : 'una') : (portionData.Gender === 'M' ? 'unos' : 'unas');
            const interrogative = amountData.Value !== 1 ? (portionData.Gender === 'M' ? 'Cuántos' : 'Cuántas') : '';

            const description = amountData.Value !== 1
                ? `${interrogative} ${portionName} de ${rubricName} consumiste ${today}`
                : `${typePrefix} ${article} ${rubricName} ${today}`;

            return description.charAt(0).toUpperCase() + description.slice(1);
        } catch (error) {
            console.error('Error building description:', error);
            return '';
        }
    };

    const handleGoalCheckbox = (goalId: string) => {
        setSelectedGoal(prevState => ({
            ...prevState,
            [goalId]: !prevState[goalId]
        }));
    };

    const handleIncrement = (goalId: string) => {
        setTextInputValues(prevState => ({
            ...prevState,
            [goalId]: Math.min((prevState[goalId] || 0) + 1, 9),
        }));
    };
    
    const handleDecrement = (goalId: string) => {
        setTextInputValues(prevState => ({
            ...prevState,
            [goalId]: Math.max((prevState[goalId] || 0) - 1, 0),
        }));
    };

    const renderGoalItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <Image
                style={styles.itemImage}
                source={getImageSource(item.title)}
            />
            <View style={styles.goalDetails}>
                <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={styles.arrow}>
                <TouchableOpacity onPress={() => handleDecrement(item.goalSelectId)}>
                    <Icon name="arrow-back" size={24} color={arrowColor} />
                </TouchableOpacity>
            </View>  
            <Text style={styles.number}>{textInputValues[item.goalSelectId] || 0}</Text>
            <View style={styles.arrow}>
                <TouchableOpacity onPress={() => handleIncrement(item.goalSelectId)}>
                    <Icon name="arrow-forward" size={24} color={arrowColor} />
                </TouchableOpacity>
            </View>  
            {item.description.includes('Cuán') ? null : (
                <CheckBox
                    checked={selectedGoal[item.goalSelectId] || false}
                    onPress={() => handleGoalCheckbox(item.goalSelectId)}
                />
            )}
        </View>
    );

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
                
                <Text style={styles.title}>Registro diario</Text>
            </View>            
            {loading ? (
                <Text>Cargando...</Text>
            ) : goals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tiene metas pendientes.</Text>
                </View>
            ) : (
                <FlatList
                    data={goals}
                    renderItem={renderGoalItem}
                    keyExtractor={(item) => item.goalSelectId}
                />
                
            )}
            <TouchableOpacity style={styles.confirmDailyButton} onPress={() => router.back()}>
                <Icon name="checkmark" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

export default DailyGoal;

const styles = StyleSheet.create({
    textInput: {
        backgroundColor: Colors.white,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginRight: 4,
        padding: 5,
        fontSize: 16,
        width: 60,
        height: 40,
        textAlign: 'center',
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
        paddingTop: 10,
        borderBottomWidth: 1
    },
    itemImage: {
        width: 60,
        height: 60,
        marginRight: 10,
    },
    goalDetails: {
        flex: 1
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
    confirmDailyButton: {
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
    arrow: {
        marginRight: 4,
        padding: 5,
        fontSize: 16,
        width: 35,
        height: 35,
        textAlign: 'center',
    },
    number: {
        fontSize: 20,
        textAlign: 'center',
        width: 40,
    },
});
