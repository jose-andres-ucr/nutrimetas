import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Colors from '@/constants/Colors';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { showMessage } from 'react-native-flash-message';

type CallbackFunction = () => void;


const CheckboxPatients = () => {
    const router = useRouter();
    const { goalDocId } = useGlobalSearchParams();
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [clicked, setClicked] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);  
            const unsubscribe = firestore()
                .collection('Patient')
                .onSnapshot(
                    (snapshot) => {
                        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                        setPatients(sortPatients(data));
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error fetching patients: ", error);
                        setLoading(false);
                        showMessage({
                            type: "danger",
                            message: "Error",
                            description: "Hubo un problema al obtener los datos de los pacientes.",
                            backgroundColor: Colors.red,
                            color: Colors.white,
                        });
                    }
                );
            return unsubscribe;
        };
    
        const unsubscribe = fetchData();
    
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    
    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const sortPatients = (patientsList: any[]) => {
        return patientsList.sort((a, b) => {
            const lastNameA = normalizeString(a.lastName);
            const lastNameB = normalizeString(b.lastName);
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });
    };

    const toggleSelection = (patientDocId: string) => {
        setSelectedIds(prevSelectedIds => {
            if (prevSelectedIds.includes(patientDocId)) {
                return prevSelectedIds.filter(id => id !== patientDocId);
            } else {
                return [...prevSelectedIds, patientDocId];
            }
        });
    };

    const handleCheckboxPress = (patientDocId: string) => {
        toggleSelection(patientDocId);
    };
    

    const showSuccessMessage = (callback: CallbackFunction) => {
        showMessage({
            type: "success",
            message: "Success",
            description: "La meta fue agregada exitosamente a todos los pacientes",
            backgroundColor: Colors.green,
            color: Colors.white,
            icon: props => <Image source={{ uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png' }} {...props} />,
            style: {
                borderRadius: 10,
            },
        });
        setTimeout(callback, 4000);
    }

    const onSubmit = () => {
        if (clicked) return;
        setClicked(true);
        const goalDocRef = firestore().collection('Goal').doc(goalDocId.toString());
        if (selectedIds.length > 0) {
            const updatePromises = selectedIds.map(patientId => (
                firestore()
                    .collection('Patient')
                    .doc(patientId)
                    .update({
                        Goals: firestore.FieldValue.arrayUnion(goalDocRef)
                    })
                    .then(() => {
                        console.log("Patient sent: ", patientId);
                    })
                    .catch((error) => {
                        console.error('Error adding goal to patient: ', error);
                    })
            ));

            Promise.all(updatePromises)
                .then(() => {
                    setClicked(false);
                    router.back();
                    showSuccessMessage(() => { });
                    console.log('Patients Goals added!');
                })
                .catch((error) => {
                    setClicked(false);
                    console.error('Error updating goals for patients: ', error);
                });
        } else {
            setClicked(false);
            showSuccessMessage(() => {
                router.back();
            });
        }
    };

    const formatId = (idNumber: string) => {
        return idNumber.replace(/(\d{1})(\d{4})(\d{4})/, "$1-$2-$3");
    };

    const filteredPatients = patients.filter(patient => {
        const searchTermLower = normalizeString(searchTerm);

        const firstNameMatch = normalizeString(patient.firstName).includes(searchTermLower);
        const lastNameMatch = normalizeString(patient.lastName).includes(searchTermLower);
        const idMatch = patient.idNumber.toLowerCase().startsWith(searchTermLower.replace(/-/g, ''));

        const fullNameWithLastName = normalizeString(patient.lastName.trim() + " " + patient.firstName.trim());
        const fullNameWithFirstName = normalizeString(patient.firstName.trim() + " " + patient.lastName.trim());
        const fullNameMatch = fullNameWithLastName.includes(searchTermLower) || fullNameWithFirstName.includes(searchTermLower);

        if (firstNameMatch || lastNameMatch || fullNameMatch || idMatch) {
            return true;
        }
        return false;
    });


    const renderItem = ({ item }: { item: any }) => {
        const isChecked = selectedIds.includes(item.id);

        return (
            <View>
                <View style={styles.item}>
                    <TouchableOpacity onPress={() => handleCheckboxPress(item.id)}>
                        <View style={[styles.checkbox, isChecked && styles.checked]} />
                    </TouchableOpacity>
                    <Image
                        style={styles.itemImage}
                        source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                    />
                    <View style={styles.nameAndIdContainer}>
                        <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                        <Text style={styles.itemId}>{formatId(item.idNumber)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Cargando...</Text>
            </View>
        );
    }
    

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Asignar Metas Emplatilladas</Text>
            </View>
            <FlatList
                data={filteredPatients}
                renderItem={renderItem}
                keyExtractor={(item) => item.idNumber}
                ListHeaderComponent={
                    <View style={styles.searchContainer}>
                        <View style={styles.inputContainer}>
                            <Image
                                style={styles.searchIcon}
                                source={{ uri: 'https://icons-for-free.com/iff/png/256/search+icon+search+line+icon+icon-1320073121423015314.png' }}
                            />
                            <TextInput
                                style={styles.searchBar}
                                placeholder="Paciente"
                                onChangeText={setSearchTerm}
                                value={searchTerm}
                            />
                        </View>
                    </View>
                }
            />
            <TouchableOpacity
                onPress={onSubmit}
                style={[styles.addButton, (!selectedIds.length || clicked) && styles.addButtonDisabled]}
                disabled={!selectedIds.length || clicked}
            >
                <Text style={styles.addButtonText}>Asignar platilla</Text>
            </TouchableOpacity>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 50.4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: Colors.lightblue,
        fontWeight: "bold",
        width: '116%',
        height: 55,
        position: "absolute",
        bottom: 0,
        justifyContent: "center",
        textAlign: 'center',
        color: Colors.white,
        fontSize: 16,
        lineHeight: 50
    },
    addButtonDisabled: {
        backgroundColor: Colors.gray,
    },
    addButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        borderColor: Colors.lightGray,
        borderWidth: 1,
        borderRadius: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    searchIcon: {
        width: 24,
        height: 24,
        marginRight: 5,
    },
    searchBar: {
        flex: 1,
        height: 40,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '1%',
        marginTop: '3%',
        borderBottomWidth: 1
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginRight: 10,
    },
    checked: {
        backgroundColor: Colors.lightblue,
    },
    itemImage: {
        width: 60,
        height: 60
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemId: {
        color: Colors.gray,
        fontStyle: 'italic',
        marginLeft: '2%',
    },
    nameAndIdContainer: {
        flexDirection: 'column',
    }
});

export default CheckboxPatients;