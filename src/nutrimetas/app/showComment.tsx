import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, Send, InputToolbar } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';
import sendIcon3 from '../assets/images/sendIcon3.png'

const initialMessages: IMessage[] = [
  {
    _id: 1,
    text: 'Hola como estas.',
    createdAt: new Date(),
    user: {
      _id: 1,
      name: 'Usuario',
      avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png',
    },
  },
  {
    _id: 2,
    text: 'Muy bien y tu?',
    createdAt: new Date(),
    user: {
      _id: 2,
      name: 'Profesional',
      avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png',
    },
  },
  {
    _id: 3,
    text: 'Me alegro mucho por Ti. Te puedo hacer una pregunta?',
    createdAt: new Date(),
    user: {
      _id: 1,
      name: 'Usuario',
      avatar: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png',
    },
  },
];

const ShowComment = () => {
  const [messages, setMessages] = useState(initialMessages);

  const onSend = (newMessage: IMessage[]) => {
    setMessages(GiftedChat.append(messages, newMessage));
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
          user={{ _id: 1 }} // ID del usuario actual
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
                props.currentMessage?.user._id === 1
                  ? styles.userBubble // Estilo para las burbujas del usuario actual
                  : styles.otherBubble // Estilo para las burbujas de otros usuarios
              ]}
            >
              <Text style={[
                styles.text,
                props.currentMessage?.user._id === 1
                  ? styles.userText // Color del texto para el usuario actual
                  : styles.otherText // Color del texto para otros usuarios
              ]}>{props.currentMessage?.text}</Text>
              <Text style={[
                styles.timestamp,
                props.currentMessage?.user._id === 1
                  ? styles.userTimestamp // Color de la marca de tiempo para el usuario actual
                  : styles.otherTimestamp // Color de la marca de tiempo para otros usuarios
              ]}>
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
        <View style={styles.separator} />
        </KeyboardAvoidingView>
      
    </SafeAreaView>
  );
};

export default ShowComment;

const styles = StyleSheet.create({
  containerchatBar: {
    marginBottom: -17, 
    borderRadius: 5,
    width: '90%',
    marginHorizontal: 20,
    borderBlockColor: Colors.white
  },
  container: {
    flex: 1,
    //backgroundColor: '#f8f9fa',
    bottom: 30
  },
  header: {
    top: '46%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    top: 9
  },
  chatContainer: {
    flex: 1,
    maxHeight: Dimensions.get('window').height / 2,
    top: "46%"
  },
  bubble: {
    maxWidth: '80%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
    //marginBottom: 30,
  },
  userBubble: {
    backgroundColor: Colors.lightblue, 
    alignSelf: 'flex-start',
  },
  otherBubble: {
    backgroundColor: Colors.gray, 
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: Colors.white, 
  },
  otherText: {
    color: Colors.white,
  },
  timestamp: {
    marginTop: 5,
    fontSize: 10,
    textAlign: 'right',
  },
  userTimestamp: {
    color: Colors.white,
  },
  otherTimestamp: {
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
    //backgroundColor: Colors.lightblue,
    borderRadius: 5,
    //height: 35,
    //width: 35,
    //margin: 10,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
  },
  sendIcon: {
    width: 50,
    height: 50,
    //tintColor: Colors.white
  },
  separator: {
    height: 1.5,
    backgroundColor: Colors.lightGray,
    width: '100%',
    bottom: 45
  },
});
