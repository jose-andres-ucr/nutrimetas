import { StyleSheet, FlatList, TextInput, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import { SafeAreaView } from 'react-native-safe-area-context';

type Professional = {
    firstName: string,
    lastName: string,
    email: string
}

const ProfessionalList = () => {
    const [professionals, setprofessionals] = useState<Professional[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Professionals')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    firstName: doc.data().firstName, 
                    lastName: doc.data().lastName,
                    email: doc.data().email
                }));
                setprofessionals(sortProfessionals(data));
            });

        return () => unsubscribe();
    }, []);
    
    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const sortProfessionals = (patientsList: any[]) => {
        return patientsList.sort((a, b) => {
            const lastNameA = normalizeString(a.lastName);
            const lastNameB = normalizeString(b.lastName);
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });
    };

    const filteredProfessionals = professionals.filter(professional => {

        const searchTermLower = normalizeString(searchTerm);

        const firstNameMatch = normalizeString(professional.firstName).includes(searchTermLower);
        const lastNameMatch = normalizeString(professional.lastName).includes(searchTermLower);
        const fullNameWithLastName = normalizeString(professional.lastName.trim() + " " + professional.firstName.trim());
        const fullNameWithFirstName = normalizeString(professional.firstName.trim() + " " + professional.lastName.trim());
        const fullNameMatch = fullNameWithLastName.includes(searchTermLower) || fullNameWithFirstName.includes(searchTermLower);
        const emailMatch = normalizeString(professional.email).includes(searchTermLower)

        if (firstNameMatch) {
            return firstNameMatch;
        }
        if (lastNameMatch) {
            return lastNameMatch;
        }
        if (fullNameMatch) {
            return fullNameMatch;
        }
        if (emailMatch) {
            return emailMatch
        }
    });

    if (professionals == undefined){
        return(
            <SafeAreaView>
                <View style={{height: "100%", alignItems: 'center', marginTop: '70%'}}>
                    <Text style={{textAlign:'center', fontSize: 18}}>
                        No hay profesionales que mostrar. Agregue uno con el botón de abajo
                    </Text>
                    <Image
                        source={require("@/assets/images/below-arrow.png")}
                        style={{width:24, height: 24, margin: 20}}
                    />
                </View>
            </SafeAreaView>
        )
    }
    else {
        return (
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={filteredProfessionals}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                            />
                            <View style={styles.nameAndIdContainer}>
                                <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                                <Text style={styles.itemId}>{item.email}</Text>
                            </View>
                        </View>
                    )}
                    keyExtractor={(item) => item.email}
                    ListHeaderComponent={
                        <View style={styles.searchContainer}>
                            <View style={styles.inputContainer}>
                                <Image
                                    style={styles.searchIcon}
                                    source={{ uri: 'https://icons-for-free.com/iff/png/256/search+icon+search+line+icon+icon-1320073121423015314.png' }}
                                />
                                <TextInput
                                    style={styles.searchBar}
                                    placeholder="Profesional"
                                    onChangeText={setSearchTerm}
                                    value={searchTerm}
                                />
                            </View>
                        </View>
                    }
                />
            </SafeAreaView>
        );
    }
}

export default ProfessionalList

const styles = StyleSheet.create({
    container: {
        height: "100%"
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
        borderBottomWidth: 1,
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