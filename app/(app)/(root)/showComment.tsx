import React, { useContext, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Button, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import firebase from '@react-native-firebase/app';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';
import { SessionContext } from '@/shared/Session/LoginSessionProvider';

import attachment from '@/assets/images/attachment.png';
import sendIcon3 from '@/assets/images/sendIcon2.png';
import profileIcon from '@/assets/images/ProfileIcon.png'; 
import RenderBubble from './renderBubble';
import RenderAvatar from './renderAvatar';
import RenderInputToolbar from './renderInputToolbar';

type messageProps = {
  parientIDLocalStorage: string 
};

interface UploadMediaParams {
  uri: string;
  isImage: boolean;
}

const getComments = async ({ queryKey }: { queryKey: [typeof GET_COMMENTS_QUERY_KEY, string, string] }): Promise<IMessage[]> => {
  
  const [, professionalID, patientID] = queryKey;
 
  const comments = await firebase.firestore()
  .collection('Professionals')
  .doc(professionalID)
  .collection('Patient')
  .doc(patientID)
  .collection('comments')
  .orderBy('createdAt', 'desc')
  .get();
  return comments.docs.map(doc => {
    const data = doc.data();
    return {
      _id: doc.id,
      text: data.text,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      user: data.user,
      image: data.image || null, // Si no hay imagen, se establece como null
      video: data.video || null, // Si no hay video, se establece como null
    };
  });
};

const GET_COMMENTS_QUERY_KEY = ["get-comments"] as const;

const ShowComment = (props: messageProps) => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingVisible, setUploadingVisible] = useState(false)
  const [modalMessage, setModalMessage] = useState('');

  // Sesión, rol e ID de la persona logueada
  const session = useContext(SessionContext);
  const userDocID = session && session.state === "valid" ? 
    session.userData.docId : undefined;

  // Rol de la persona logueada
  const role = session && session.state === "valid" ? session.userData.role : undefined;
  const roleID = role === "patient" ? 2 : role === "professional" ? 1 : 0;

  // ID del profesional (o profesional asignado)
  const profDocID = session && session.state === "valid" ? (
    session.userData.role === "professional" ? userDocID :
    session.userData.role === "patient" ? session.userData.assignedProfDocId : 
    undefined
  ) : undefined;

  // ID del paciente (o paciente asignado)
  const patientDocID = session && session.state === "valid" ? (
    session.userData.role === "professional" ? props.parientIDLocalStorage :
    session.userData.role === "patient" ? session.userData.docId : 
    undefined
  ) : undefined;

  var queryComments = useQuery({ 
    queryKey: [GET_COMMENTS_QUERY_KEY, profDocID as string, patientDocID as string], 
    queryFn: getComments
  })

  const renderBubble = (props: any) => <RenderBubble {...props} />;
  const renderAvatar = (props: any) => <RenderAvatar {...props} />;
  const renderInputToolbar = (props: any) => <RenderInputToolbar {...props} />;

  React.useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection('Professionals')
      .doc(profDocID)
      .collection('Patient')
      .doc(patientDocID)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .onSnapshot((querySnapshot) => {
        queryClient.setQueryData(
          [GET_COMMENTS_QUERY_KEY, profDocID, patientDocID],
          querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              _id: doc.id,
              text: data.text,
              createdAt: data.createdAt?.toDate() ?? new Date(),
              user: data.user,
              image: data.image || null, // Si no hay imagen, se establece como null
              video: data.video || null, // Si no hay video, se establece como null
            };
          })
        );
      });
    return () => unsubscribe();
  }, [profDocID, patientDocID, props.parientIDLocalStorage]);

  const uploadMediaToStorage = async ({ uri, isImage }: UploadMediaParams): Promise<string>=> {
    const randomComponent1 = Math.random().toString(36).substring(2, 9);
    const randomComponent2 = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, ''); 
    const uniqueImageId = randomComponent1 + randomComponent2 + patientDocID + timestamp;

    let storageRef 

    if (isImage){
      storageRef = storage().ref(`Comments/${patientDocID}/${uniqueImageId}.jpg`);
      console.log("Path es", `Comments/${patientDocID}/${uniqueImageId}.jpg`);

    }else{
      storageRef = storage().ref(`Comments/${patientDocID}/${uniqueImageId}.mp4`);
      console.log("Path es", `Comments/${patientDocID}/${uniqueImageId}.mp4`);
    }

    await storageRef.putFile(uri);

    const downloadUrl = await storageRef.getDownloadURL();
    console.log("downloadUrl", downloadUrl);

    return downloadUrl;
  };

  const queryUpload = useMutation<string, Error, UploadMediaParams>({
    mutationFn: uploadMediaToStorage,
    onMutate: () => {
      setModalMessage('Guardando y enviando...');
      setUploadingVisible(true);
    },
    onSuccess: () => {
      setTimeout(() => setUploadingVisible(false), 1000);
    },
    onError: (error) => {
      console.error("Error uploading media: ", error);
      setModalMessage('Error uploading media');
      setTimeout(() => setUploadingVisible(false), 2000);
    },
  });

  const onSend = async (newMessage: IMessage[], imageUri?: string, videoUri?: string) => {
    try {
      const db = firebase.firestore();
      const messageData: any = {
        text: newMessage[0].text,
        createdAt: newMessage[0].createdAt,
        user: {
          _id: roleID,
          name: role,
          avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'
        }
      };
      
      if (imageUri) {
        const params = {
          uri: imageUri,
          isImage: true
        }
        const imageUrl =  await queryUpload.mutateAsync(params);
        messageData.image = imageUrl;
      }

      if (videoUri) {
        const params = {
          uri: videoUri,
          isImage: false
        }
        const videoUrl = await queryUpload.mutateAsync(params);
        messageData.video = videoUrl;
      }
      await db.collection('Professionals').doc(profDocID).collection('Patient').doc(patientDocID).collection('comments').add(messageData);
      console.log("Guardado!");
    } catch (error) {
      console.error("Error saving message to Firestore: ", error);
    }
  };

  const handleOptionSelect = (option: string) => {
    setModalVisible(false);
   
    switch (option) {

      case 'photo':
        ImagePicker.launchCamera({ mediaType: 'photo' }, (response) => {

          if (response.didCancel) {
            console.log('User cancelled image picker');
            
          } else if (response.errorMessage) {
            console.log('ImagePicker Error: ', response.errorMessage);

          } else if (response.assets && response.assets.length > 0) {
            
            const image = response.assets[0];
            console.log('Image selected: ', image);

            const newMessage: IMessage = {
              _id: Math.random().toString(36).substring(7),
              text: '', 
              createdAt: new Date(),
              user: {
                _id: roleID,
                name: role,
                avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'
              },
            };
            onSend([newMessage], image.uri);
          }
        });
        break;

      case 'video': 
        ImagePicker.launchCamera({ mediaType: 'video' }, (response) => {
          if (response.assets && response.assets.length > 0) {
            
            const video = response.assets[0];
            console.log('Video selected: ', video);
            const newMessage: IMessage = {
              _id: Math.random().toString(36).substring(7),
              text: '', 
              createdAt: new Date(),
              user: {
                _id: roleID,
                name: role,
                avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'
              },
            };
            onSend([newMessage], undefined, video.uri);
          }
        });
        break;

      case 'gallery':
        ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
          if (response.assets && response.assets.length > 0) {
            const image = response.assets[0];
            console.log('Media selected: ', image);
            const newMessage: IMessage = {
              _id: Math.random().toString(36).substring(7),
              text: '', 
              createdAt: new Date(),
              user: {
                _id: roleID,
                name: role,
                avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'
              },
            };
            onSend([newMessage], image.uri);
          }
        });
        break;

      default:
        break;
    }
  };

  if( queryComments.isFetching ){
    return(
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando</Text>
          <Image
            source={require("@/assets/images/loading.gif")}
          />
        </View>
      </SafeAreaView>
    )
  } else {

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Comentarios</Text>
          </View>
          <KeyboardAvoidingView style={styles.chatContainer}>
            <GiftedChat
              messages={queryComments.data}
              onSend={newMessage => onSend(newMessage)}
              user={{ _id: roleID }} 
              renderAvatar={renderAvatar}
              renderBubble={renderBubble}
              placeholder="Haz un comentario"
              renderInputToolbar={renderInputToolbar}
              renderSend={(props) => (
                <View style={styles.sendContainer}>

                  <TouchableOpacity style={styles.optionButton} onPress={() => setModalVisible(true)} >
                    <Image source={attachment}/>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.sendButton}
                    onPress={() => {
                      if (props.text && props.onSend) {
                        props.onSend({ text: props.text.trim() }, true);
                      }
                    }}
                  >
                    <Image source={sendIcon3} style={styles.sendIcon} />
                  </TouchableOpacity>
                </View>
              )} 
            />
          </KeyboardAvoidingView>

          <Modal
            transparent={true}
            visible={modalVisible}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalButton}>
                  <Button title="Galería" onPress={() => handleOptionSelect('gallery')} />
                </View>
                <View style={styles.modalButton}>
                  <Button title="Foto" onPress={() => handleOptionSelect('photo')} />
                </View>
                <View style={styles.modalButton}>
                  <Button title="Video" onPress={() => handleOptionSelect('video')} />
                </View>
                <View style={{...styles.modalButton, width: '50%', alignSelf: 'center', marginTop: 30}}>
                  <Button title="Cancelar" onPress={() => setModalVisible(false)} />
                </View>
              </View>
            </View>
          </Modal>
          <Modal
              transparent={true}
              visible={uploadingVisible}
              animationType="fade"
              onRequestClose={() => setModalVisible(false)}
            >
            <View style={{...styles.modalContainer, justifyContent: 'center'}}>
              <View style={{...styles.modalContent, backgroundColor: Colors.white, width: 'auto'}}>
                <Text>{modalMessage}</Text>
              </View>
            </View>
          </Modal>
      </SafeAreaView>
    );
  }
};

export default ShowComment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  sendIcon: {
    width: 30,
    height: 30,
    margin: 5
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    borderRadius: 20,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  modalButton: {
    margin: 10,
  },
  sendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});