import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Colors from '@/constants/Colors';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCheckBoxPatientsFirestoreQuery } from '@/components/FetchData';
import PatientItem from '../../../components/PatientItem';

type CallbackFunction = () => void;


const CheckboxPatients = () => {
    const router = useRouter();
    const { goalDocId } = useGlobalSearchParams();

    const { data: patients = [], error, isLoading: loading } = useCheckBoxPatientsFirestoreQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [clicked, setClicked] = useState<boolean>(false);
    const normalizedGoalDocId = Array.isArray(goalDocId) ? goalDocId[0] : goalDocId;
    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

    const showErrorMessage = (callback: CallbackFunction) => {
        showMessage({
            type: "danger",
            message: "Error",
            description: "Hubo un error al agregar la meta a los pacientes",
            backgroundColor: Colors.red,
            color: Colors.white,
            icon: props => <Image source={{ uri: 'https://www.iconpacks.net/icons/5/free-icon-red-cross-mark-approval-16197.png' }} {...props} />,
            style: {
                borderRadius: 10,
            },
        });
        setTimeout(callback, 4000);
    }


    const onSubmit = () => {
        if (clicked) return;
        setClicked(true);
        const goalDocRef = firestore().collection('Goal').doc(goalDocId?.toString());
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
                    showErrorMessage(() => { });
                });
        } else {
            showErrorMessage(() => { });
        }
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
                renderItem={({ item }) => (
                    <PatientItem
                        item={item}
                        handleCheckboxPress={handleCheckboxPress}
                        selectedIds={selectedIds}
                        loading={loading}
                        goalDocId={normalizedGoalDocId ?? ''}
                    />
                )}
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
    checkedDisabled: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginRight: 10,
        backgroundColor: Colors.gray,
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
    },

});

export default CheckboxPatients;
