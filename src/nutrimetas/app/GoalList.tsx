
import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import { router, useRouter, useSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';  // Importa el contexto de la sesión
import { useGlobalSearchParams } from 'expo-router';

const GoalList = () => {
    // const route = useRoute();
    const navigation = useNavigation();
    const { patientId } = useGlobalSearchParams();
    const { role } = useContext(SessionContext);
    // const patientId = route.params?.sessionDocId;
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // console.log(patientId);
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Patient')
            .doc(patientId.toString())
            .onSnapshot((snapshot) => {
                const patientData = snapshot.data();
                const patientGoals = patientData && patientData.Goals ? patientData.Goals : [];

                if (patientGoals.length > 0) {
                    fetchGoalsFromFirebase(patientGoals);
                } else {
                    setLoading(false); // No hay metas, actualiza el estado de carga
                    console.log('El paciente no tiene metas.');
                }
            });

        return () => unsubscribe();
    }, [patientId]);

    const fetchGoalsFromFirebase = async (patientGoals: any) => {
        const goalsFromFirebase = [];

        for (const goalId of patientGoals) {
            // Verificar si goalId es una cadena (ID de objetivo)
            if (typeof goalId.id === 'string') {
                const goalDoc = await firestore().collection('Goal').doc(goalId.id).get();
                if (goalDoc.exists) {
                    // console.log(goalDoc.data());
                    const goalData = goalDoc.data();
                    if (goalData) { // Verificar si goalData está definido
                        const title = await buildTitle(goalData.Rubric);
                        const description = await buildDescription(goalData);
                        goalsFromFirebase.push({ ...goalData, title, description });
                    } else {
                        console.error('Goal data is undefined for goal ID:', goalId.id);
                    }
                    // goalsFromFirebase.push(goalDoc.data());
                }
            } else {
                console.error('Invalid goal ID:', goalId);
            }
        }

        setGoals(goalsFromFirebase);
        setLoading(false); // Actualiza el estado de carga
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
            return 'Meta'; // O valor predeterminado
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


    const onPressHandle = (selectedGoal: any) => {
        console.log(selectedGoal);
    };

    const handleAddGoal = () => {
        navigation.navigate('assingGoal', { sessionDocId: patientId });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Metas</Text>
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
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onPressHandle(item)}>
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
                    keyExtractor={(item, index) => index.toString()} // TODO: Utilizar llave primaria de BD
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
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20, // Added paddingRight for space for the tittle
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
        marginLeft: 10, // Margin on the left to separate the button from the title
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
});


/*
import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoute } from '@react-navigation/native';

const GoalList = () => {
    const route = useRoute();
    const patientId = route.params?.selectedPatientId;
    const [goals, setGoals] = useState<any[]>([]);
    //const [patientInfo, setPatientInfo] = useState<any>();

    useEffect(() => {
        const patient = firestore()
            .collection('Patient')
            .where('name', '==', patientId);
        const patientUnsubscribe = patient.onSnapshot((snapshot) => {
            const patientData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log(patientData[0].Goals[0]);
            //setPatientInfo(patientData);

            // Solo obtendremos el primer objetivo del primer paciente para establecerlo
            if (patientData.length > 0 && patientData[0].Goals.length > 0) {
                patientData.forEach(patient => {
                    patient.Goals.forEach((goal, index) => {
                        // Esto imprimirá cada objetivo del paciente
                        const goalRef = patient.Goals[index];
                        //console.log(patient.Goals[index]);
                        goalRef.get().then((doc) => {
                            if (doc.exists) {
                                setGoals([doc.data()]);
                            } else {
                                console.log("No such document!");
                            }
                        }).catch((error) => {
                            console.log("Error getting document:", error);
                        });
                    });
                });
            } else {
                console.log("The patient does have goals");
            }
        });
        return () => {
            patientUnsubscribe();
        };
    }, [patientId]);


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

*/