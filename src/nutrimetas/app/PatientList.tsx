import { StyleSheet, TouchableOpacity, FlatList, View, Text, TextInput, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import FlashMessage from "react-native-flash-message";
import { useNavigation } from '@react-navigation/native';
import Colors from '@/constants/Colors';

const PatientList = () => {
    const navigation = useNavigation();
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Patient')
            .orderBy('lastName') 
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setPatients(data);
            });

        return () => unsubscribe();
    }, []);

    const onPressHandle = async (patientDocId: string) => {
        navigation.navigate('GoalList', { sessionDocId: patientDocId });
    };

    const filteredPatients = patients.filter(patient => {

        const searchTermLower = searchTerm.toLowerCase();
        const firstNameWords = patient.firstName.toLowerCase().split(" ");
        const lastNameWords = patient.lastName.toLowerCase().split(" ");

        // Verifica si alguna palabra del firstName o lastName comienza con la búsqueda
        const firstNameSplitMatches = firstNameWords.some((word: string) => word.startsWith(searchTermLower));
        const lastNameSplitMatches = lastNameWords.some((word: string) => word.startsWith(searchTermLower));

        const firstNameMatch = patient.firstName.toLowerCase().startsWith(searchTermLower);
        const lastNameMatch = patient.lastName.toLowerCase().startsWith(searchTermLower);
        const idMatch = patient.id.toLowerCase().startsWith(searchTermLower);
        
        const fullNameWithLastName = patient.lastName.toLowerCase().trim() + " " + patient.firstName.toLowerCase().trim();
        const fullNameWithFirstName = patient.firstName.toLowerCase().trim() + " " + patient.lastName.toLowerCase().trim();
        const fullNameMatch = fullNameWithLastName.startsWith(searchTermLower) || fullNameWithFirstName.startsWith(searchTermLower);

        if (firstNameSplitMatches){
            return firstNameSplitMatches;
        }
        if(lastNameSplitMatches){
            return lastNameSplitMatches;
        }
        if(fullNameMatch){
            return fullNameMatch;
        }

        return  firstNameMatch || lastNameMatch || idMatch;
    });

    function formatId(id: string) {
        return id.replace(/(\d{1})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    return (
        <View>
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
            <FlatList
                data={filteredPatients}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandle(item.id)}>
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                            />
                            <View style={styles.nameAndIdContainer}>
                                <Text style={styles.itemName}> {item.lastName.trim()} {item.firstName.trim()} </Text>
                                <Text style={styles.itemId}>{formatId(item.id)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.email}
            />
        </View>
    );
}

export default PatientList

const styles = StyleSheet.create({
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
        margin: '2%',
        borderBottomWidth: 1
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