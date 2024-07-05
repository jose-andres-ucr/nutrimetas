import React, { useState, useContext, useEffect } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { View, Text, useThemeColor } from '@/components/Themed'
import Colors from '@/constants/Colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { SessionContext } from '@/shared/LoginSession';
import { useRouter, useGlobalSearchParams } from 'expo-router';

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

interface Goal {
    id: string;
}

const GoalDelete = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const { patientId } = useGlobalSearchParams();
    const session = useContext(SessionContext);
    const role = useContext(SessionContext)?.role;
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
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

    const onPressHandle = (goalId: string) => {
        setSelectedGoalIds(prevSelectedGoalIds =>
            prevSelectedGoalIds.includes(goalId)
                ? prevSelectedGoalIds.filter(id => id !== goalId)
                : [...prevSelectedGoalIds, goalId]
        );
    };

    const handleDeleteGoals = async () => {
        if (patientId) {
            try {
                const patientDocRef = firestore()
                    .collection('Professionals')
                    .doc(session?.docId)
                    .collection('Patient')
                    .doc(patientId.toString());

                const patientDoc = await patientDocRef.get();
                if (!patientDoc.exists) {
                    console.error("No se encontró el documento del paciente.");
                    return;
                }

                const patientData = patientDoc.data();
                const goals = patientData?.Goals || [];

                const goalsToRemove = goals.filter((goal: Goal) => selectedGoalIds.includes(goal.id));
                if (goalsToRemove.length === 0) {
                    console.error("No se encontraron las metas en el array de referencias.");
                    return;
                }

                await patientDocRef.update({
                    Goals: firestore.FieldValue.arrayRemove(...goalsToRemove)
                });

                setSelectedGoalIds([]);
                router.replace({ pathname: '/GoalList', params: { patientId: patientId } });
            } catch (error) {
                console.error("Error deleting goals:", error);
            }
        }
    };

    const getImageSource = (rubric: string) => {
        const lowerCaseRubric = rubric.toLowerCase();
        switch (lowerCaseRubric) {
            case 'actividad física':
                return images.carne;
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={arrowColor} />
                </TouchableOpacity>
                <Text style={styles.title}>Metas</Text>
            </View>
            <Text style={styles.title}>Seleccione metas a eliminar</Text>
            {goals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tiene metas para eliminar.</Text>
                </View>
            ) : (
                <FlatList
                    data={goals}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onPressHandle(item.goalSelectId)}>
                            <View style={[styles.item, selectedGoalIds.includes(item.goalSelectId) && styles.selectedItem]}>
                                <Image
                                    style={styles.itemImage}
                                    source={getImageSource(item.title)}
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
            {goals.length !== 0 && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGoals}>
                    <Icon name="trash" size={24} color="white" />
                    <Text style={styles.deleteButtonText}>Eliminar Metas</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default GoalDelete;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20,
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
    selectedItem: {
        backgroundColor: '#d3d3d3',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        marginTop: 20,
    },
    deleteButtonText: {
        color: 'white',
        marginLeft: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center'
    },
    itemImage: {
        width: 60,
        height: 60,
        marginRight: 10,
    },
});


