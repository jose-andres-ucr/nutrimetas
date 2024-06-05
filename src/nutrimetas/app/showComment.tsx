import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, KeyboardAvoidingView, Button, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, InputToolbar } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';
import firebase from '@react-native-firebase/app';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'react-native-image-picker';

import attachment from '../assets/images/attachment.png' 
import sendIcon3 from '../assets/images/sendIcon2.png'
import loadingGif from '../assets/images/loading.gif';

type messageProps = {
  role: string,
  goalId: string
};

const ShowComment = (props: messageProps) => {

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const roleId = props.role == "patient" ? 2 : 1

  const fetchComments = async () => {
    const db = firebase.firestore();
    const commentsRef = db.collection('Goal').doc(props.goalId).collection('comments');
    
    const unsubscribe = commentsRef.orderBy('createdAt', 'desc').onSnapshot((querySnapshot) => {
      const fetchedMessages: IMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          user: data.user,
        };
      });
      setMessages(fetchedMessages);
    });
    return () => unsubscribe();
  };

  useEffect(() => {
    fetchComments();
  }, [props.goalId]);

  var  { status } = useQuery({ 
    queryKey: ['comments'], 
    queryFn: fetchComments 
  })

  const onSend = async (newMessage: IMessage[]) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessage));
    console.log("Guardando el mensaje:", newMessage)

    try {
      const db = firebase.firestore();
      await db.collection('Goal').doc(props.goalId).collection('comments').add({
        text: newMessage[0].text,
        createdAt: newMessage[0].createdAt,
        user: {
          _id: roleId,
          name: props.role,
          avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png'
        }
      });
      console.log("Guardado!")
    } catch (error) {
      console.error("Error saving message to Firestore: ", error);
    }
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.containerchatBar}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <View style={styles.sendContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={attachment}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            if (props.text && props.onSend) {
              props.onSend({ text: props.text.trim() }, true);
            }
          }}
        >
          <Image
            source={sendIcon3}
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const handleOptionSelect = (option: string) => {
    setModalVisible(false);
    switch (option) {
      case 'photo':
        ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.log('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            const image = response.assets[0];
            // Handle selected image here
            console.log('Image selected: ', image);
          }
        });
        break;

      case 'video': 
        ImagePicker.launchCamera({ mediaType: 'video', durationLimit: 10 }, (response) => {
          if (response.assets && response.assets.length > 0) {
            const image = response.assets[0];
          }
        });
        break;

      case 'gallery':
        ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
          if (response.assets && response.assets.length > 0) {
            const image = response.assets[0];
          }
        });
        break;

      default:
        break;
    }
  };

  if(status == 'pending'){
    return(
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando</Text>
          <Image
            source={loadingGif}
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
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior="height" // Esto es para que la barra de comentarios salga por arriba del teclado cuando se despliega el teclado
          >
            <GiftedChat
              messages={messages}
              onSend={newMessage => onSend(newMessage)}
              user={{ _id: roleId }} // ID del usuario actual
              renderAvatar={(props) => (
                <Image
                  source={{ uri: props.currentMessage?.user.avatar as string }}
                  style={styles.avatar}
                />
              )}
              renderBubble={(props) => (
                <View
                style={[
                  styles.bubble,
                  // Cambiamos los estilos para que los mensajes del usuario actual sean celestes y los de la otra persona sean grises
                  props.currentMessage?.user._id === (roleId)
                    ? styles.userBubble // Estilo para las burbujas del usuario actual
                    : styles.otherBubble // Estilo para las burbujas de otros usuarios
                ]}
                >
                  <Text style={styles.text}>{props.currentMessage?.text}</Text>
                  <Text style={styles.timestamp}>
                    {props.currentMessage?.createdAt
                      ? new Date(props.currentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </Text>
                </View>
              )}
              renderSend={renderSend}
              placeholder="Haz un comentario"
              renderInputToolbar={renderInputToolbar}
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
      </SafeAreaView>
    );
  }
};

export default ShowComment;

const styles = StyleSheet.create({
  containerchatBar: {
    borderRadius: 5,
    width: '90%',
    marginHorizontal: 20,
    borderBlockColor: Colors.white,
  },
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
    maxHeight: Dimensions.get('window').height / 2,
  },
  bubble: {
    maxWidth: '80%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10
  },
  userBubble: {
    backgroundColor: Colors.lightblue, 
  },
  otherBubble: {
    backgroundColor: Colors.gray, 
  },
  text: {
    fontSize: 16,
    color: Colors.white,
  },
  timestamp: {
    marginTop: 5,
    fontSize: 10,
    textAlign: 'right',
    color: Colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
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
  optionButtonText: {
    color: Colors.white,
    fontSize: 20,
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
});
