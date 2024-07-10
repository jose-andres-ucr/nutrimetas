import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import Colors from '@/constants/Colors';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalSearchParams } from 'expo-router';
import { CheckBox } from 'react-native-elements';

const DailyGoal = () => {
    const router = useRouter();
    const { patientId } = useGlobalSearchParams();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState<{ [key: string]: boolean }>({});
    const [textInputValues, setTextInputValues] = useState<{ [key: string]: string }>({});
    
    useEffect(() => {
        if (patientId) {
            const unsubscribe = firestore()
                .collection('Patient')
                .doc(patientId.toString())
                .onSnapshot((snapshot) => {
                    if (snapshot){
                        const patientData = snapshot.data();
                        const patientGoals = patientData && patientData.Goals ? patientData.Goals : [];

                        if (patientGoals.length > 0) {
                            fetchGoalsFromFirebase(patientGoals);
                        } else {
                            setLoading(false);
                            console.log('El paciente no tiene metas.');
                        }
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
                        const description = await buildDailyGoal(goalData);
                        goalsFromFirebase.push({ ...goalData,  description, goalSelectId });
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

    const buildDailyGoal = async (goalData:any) => {
        try {
            const [rubricData, actionData, amountData, portionData] = await Promise.all([
                fetchReferenceData('Rubric', goalData.Rubric),
                fetchReferenceData('Action', goalData.Action),
                fetchReferenceData('Amount', goalData.Amount),
                fetchReferenceData('Portion', goalData.Portion),
            ]);
            if (!rubricData || !actionData || !amountData || !portionData) {
                console.error('Missing data for building description');
                return '';
            }
    
            let typePrefix;
            if (actionData.Name.includes('consumo')) {
                typePrefix = 'Consumiste';
            } else {
                typePrefix = 'Realizaste';
            } 
            const today = 'hoy?';
    
            // Elimina mayúsculas innecesarias
            const rubricName = rubricData.Name.toLowerCase();
            const portionName = amountData.Value === 1 ? portionData.Name.toLowerCase() : portionData.Plural.toLowerCase();
    
            // Determinar el género
            let article;
            if (amountData.Value === 1) {
                article = portionData.Gender === 'M' ? 'un' : 'una';
            } else {
                article = portionData.Gender === 'M' ? 'unos' : 'unas';
            }
    
            let interrogative;
            if (amountData.Value !== 1) {
                interrogative = portionData.Gender === 'M' ? 'Cuántos' : 'Cuántas';
            }
    
            // Construcción de la oración basada en la cantidad
            let description;
            if (amountData.Value !== 1) {
                description = `${interrogative} ${portionName} de ${rubricName} consumiste ${today}`;
            } else {
                // Actividad fisica
                description = `${typePrefix} ${article} ${rubricName} ${today}`;
            }
            // Mayúscula solo para la primera letra de la oración
            const result = description.charAt(0).toUpperCase() + description.slice(1);    
            return result;
        } catch (error) {
            console.error('Error building description:', error);
            return '';
        }
    };

    const confirmDaily = () => {
        router.back();
    };

    const GoalCheckbox = (goalId: string) => {
        setSelectedGoal(prevState => ({
            ...prevState,
            [goalId]: !prevState[goalId] // Cambia el estado del checkbox
        }));
    };

    // El numero solo se admite de 0-9
    const handleTextInputChange = (goalId: string, text: string) => {
        const newText = text.replace(/[^0-9]/g, '');
        if (newText.length <= 1) {
            setTextInputValues(prevState => ({
                ...prevState,
                [goalId]: newText,
            }));
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Registro de hoy</Text>
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
                            <View style={styles.item}>
                                <Image
                                    style={styles.itemImage}
                                    source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                                />
                                <View style={styles.goalDetails}>
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                </View>
                                {item.description.includes('Cuán') ? ( 
                                    <TextInput
                                        style={styles.textInput}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        value={textInputValues[item.goalSelectId] || ''}
                                        onChangeText={(text) => handleTextInputChange(item.goalSelectId, text)}
                                    />
                                ) : (
                                    <CheckBox 
                                        checked={selectedGoal[item.goalSelectId] || false}
                                        onPress={() => GoalCheckbox(item.goalSelectId)}
                                    />
                                )}
                            </View>
                    )}
                    keyExtractor={(item, index) => `${item.title}-${index}`}
                />  
            )}
            <TouchableOpacity style={styles.confirmDailyButton} onPress={confirmDaily}>
                <Icon name="checkmark" size={24} color="white"/>
            </TouchableOpacity>
        </View>
    );
}
export default DailyGoal;

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
    goalDetails: {
        flex: 1
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
    textInput: {
        backgroundColor: Colors.white,
        borderColor: 'gray' ,
        borderWidth: 1,
        borderRadius: 5,
        marginRight: 24,
        padding: 5,
        fontSize: 16,
        width: 20,
        height: 28, 
        textAlign: 'center' ,
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
});
