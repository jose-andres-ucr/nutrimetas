import { StyleSheet, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionContext } from '@/shared/Session/LoginSessionProvider';
import profileIcon from '@/assets/images/ProfileIcon.png';
import searchIcon from '@/assets/images/searchIcon.png';

const ProfessionalList = () => {
    const router = useRouter();
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const session = useContext(SessionContext);
    const actualProfessionalID = session && session.state === "valid" ? 
        session.userData.docId : undefined;

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Professionals')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                const filteredData = data.filter(professional => professional.id !== actualProfessionalID);
                setProfessionals(sortProfessionals(filteredData));
            });

        return () => unsubscribe();
    }, []);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const sortProfessionals = (professionalsList: any[]) => {
        return professionalsList.sort((a, b) => {
            const lastNameA = normalizeString(a.lastName);
            const lastNameB = normalizeString(b.lastName);
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });
    };

    const onPressHandle = async (professionalDocId: string) => {
        console.log("EN PROFESIONALLIST ", professionalDocId);
        router.push({ pathname: '/transferPatient', params: { targetProfessionalId: professionalDocId } });
    };

    const filteredProfessionals = professionals.filter(professional => {

        const searchTermLower = normalizeString(searchTerm);

        const firstNameMatch = normalizeString(professional.firstName).includes(searchTermLower);
        const lastNameMatch = normalizeString(professional.lastName).includes(searchTermLower);

        const fullNameWithLastName = normalizeString(professional.lastName.trim() + " " + professional.firstName.trim());
        const fullNameWithFirstName = normalizeString(professional.firstName.trim() + " " + professional.lastName.trim());
        const fullNameMatch = fullNameWithLastName.includes(searchTermLower) || fullNameWithFirstName.includes(searchTermLower);

        if (firstNameMatch) {
            return firstNameMatch;
        }
        if (lastNameMatch) {
            return lastNameMatch;
        }
        if (fullNameMatch) {
            return fullNameMatch;
        }
    });
    
    if (professionals.length == 0){
        return(
            <SafeAreaView>
                <View style={{height: "100%", alignItems: 'center', marginTop: '70%'}}>
                    <Text style={{textAlign:'center', fontSize: 18}}>
                        No hay profesionales que mostrar
                    </Text>
                </View>
            </SafeAreaView>
        )
    }
    return (
        <SafeAreaView>
            <FlatList
                data={filteredProfessionals}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandle(item.id)}>
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={profileIcon}
                            />
                            <View style={styles.nameAndIdContainer}>
                                <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.email}
                ListHeaderComponent={
                    <View >
                        <View style={styles.title}>
                            <Text style={styles.subtitle}>Elija Profesional Para Transferir Pacientes</Text>
                        </View>
                        <View style={styles.searchContainer}>
                            <View style={styles.inputContainer}>
                                <Image
                                    style={styles.searchIcon}
                                    source={searchIcon}
                                />
                                <TextInput
                                    style={styles.searchBar}
                                    placeholder="Profesional"
                                    onChangeText={setSearchTerm}
                                    value={searchTerm}
                                />
                            </View>
                        </View>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

export default ProfessionalList

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
    },
    title: {
        alignItems: 'center',
        top: '-8%'
    },
    subtitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
    },
});