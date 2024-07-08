import React, { useContext, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions, KeyboardAvoidingView, Button, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, InputToolbar } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import firebase from '@react-native-firebase/app';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';
import Video from "react-native-video"
import { SessionContext } from '@/shared/LoginSession';

import attachment from '@/assets/images/attachment.png';
import sendIcon3 from '@/assets/images/sendIcon2.png';

const RenderMessageImage = (props: any) => {

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  return (
    <SafeAreaView>
      <TouchableOpacity onPress={() => setFullScreenImage(props.currentMessage.image)}>
        <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.currentMessage.image }}
          style={styles.messageImage}
        />
        <Text style={styles.timestampImage}>
        {props.currentMessage?.createdAt
          ? new Date(props.currentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''}
        </Text>
        </View>
      </TouchableOpacity>

      <Modal
      visible={!!fullScreenImage}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setFullScreenImage(null)}
      >
      <View style={styles.fullScreenImageContainer}>
        <Image
          source={{ uri: fullScreenImage || '' }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setFullScreenImage(null)}
        >
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      </Modal>
    </SafeAreaView>
  );
}

export default RenderMessageImage

const styles = StyleSheet.create({
  timestampImage: {
    fontSize: 10,
    textAlign: 'right',
    color: Colors.white,
    position: 'absolute',
    bottom: 0,
    right: 0,
    marginRight: 5, // Ajusta el espaciado desde el borde derecho de la burbuja
    marginBottom: 5, 
  },
  messageImage: {
    flex: 1,
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 5,
    overflow: 'hidden',
    margin: -5,
    marginTop: -56,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#000',
  },
});