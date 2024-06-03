import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, InputToolbar } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';
import sendIcon3 from '../assets/images/sendIcon2.png'
import firebase from '@react-native-firebase/app';

type messageProps = {
  role: string,
  goalId: string
};

const ShowComment = (props: messageProps) => {

  const [messages, setMessages] = useState<IMessage[]>([]);
  const roleId = props.role == "patient" ? 2 : 1

  useEffect(() => {
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

    fetchComments();
    console.log("props.role es", props.role)
  }, [props.goalId]);

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
    );
  };

  

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
      
    </SafeAreaView>
  );
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chatContainer: {
    height: "50%",
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
    //alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: Colors.gray, 
    //alignSelf: 'flex-end',
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
  }
});
