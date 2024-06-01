import { StyleSheet, TouchableOpacity, FlatList, View, Text, TextInput, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
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
        //navigation.navigate('GoalList', { sessionDocId: patientDocId });
        navigation.navigate('showComment');
    };

    const filteredPatients = patients.filter(patient => {

        const searchTermLower = searchTerm.toLowerCase();

        const firstNameMatch = patient.firstName.toLowerCase().includes(searchTermLower);
        const lastNameMatch = patient.lastName.toLowerCase().includes(searchTermLower);
        const idMatch = patient.idNumber.toLowerCase().startsWith(searchTermLower.replace(/-/g, ''));
        
        const fullNameWithLastName = patient.lastName.toLowerCase().trim() + " " + patient.firstName.toLowerCase().trim();
        const fullNameWithFirstName = patient.firstName.toLowerCase().trim() + " " + patient.lastName.toLowerCase().trim();
        const fullNameMatch = fullNameWithLastName.includes(searchTermLower) || fullNameWithFirstName.includes(searchTermLower);

        if(firstNameMatch){
            return firstNameMatch;
        }
        if(lastNameMatch){
            return lastNameMatch;
        }
        if(fullNameMatch){
            return fullNameMatch;
        }
        if(idMatch){
            return idMatch;
        }
    });

    function formatId(idNumber: string) {
        return idNumber.replace(/(\d{1})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    return (
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
                            <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                            <Text style={styles.itemId}>{formatId(item.idNumber)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
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
        margin: '1%',
        marginTop: '3%',
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