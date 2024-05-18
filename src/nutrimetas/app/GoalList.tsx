
import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';  // Importa el contexto de la sesión

const GoalList = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { role } = useContext(SessionContext);  // Obtén el rol del contexto de la sesión
    const patientId = route.params?.sessionDocId;
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Patient')
            .doc(patientId)
            .onSnapshot((snapshot) => {
                const patientData = snapshot.data();
                const patientGoals = patientData && patientData.Goals ? patientData.Goals : [];

                if (patientGoals.length > 0) {
                    fetchGoalsFromFirebase(patientGoals);
                } else {
                    setLoading(false); // No hay metas, actualiza el estado de carga
                    console.log('El paciente no tiene objetivos.');
                }
            });

        return () => unsubscribe();
    }, [patientId]);

    const fetchGoalsFromFirebase = async (patientGoals) => {
        const goalsFromFirebase = [];

        for (const goalId of patientGoals) {
            // Verificar si goalId es una cadena (ID de objetivo)
            if (typeof goalId.id === 'string') {
                const goalDoc = await firestore().collection('Goal').doc(goalId.id).get();
                if (goalDoc.exists) {
                    goalsFromFirebase.push(goalDoc.data());
                }
            } else {
                console.error('Invalid goal ID:', goalId);
            }
        }

        setGoals(goalsFromFirebase);
        setLoading(false); // Actualiza el estado de carga
    };

    const getDescription = (goal: any) => {
        return `${goal.Description} a ${goal.Frequency} veces, ${goal.Modality}`;
    };

    const onPressHandle = (selectedGoal: any) => {
        console.log(selectedGoal);
    };

    const handleAddGoal = () => {
        console.log(patientId);
        navigation.navigate('assingGoal', { patientId });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Metas</Text>
            </View>
            {loading ? (
                <Text>Cargando...</Text>
            ) : goals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tiene objetivos pendientes.</Text>
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
                                    <Text style={styles.itemTitle}>{item.Title}</Text>
                                    <Text style={styles.itemDescription}>{getDescription(item)}</Text>
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