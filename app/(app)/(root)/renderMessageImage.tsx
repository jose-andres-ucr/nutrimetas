import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";

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
    flex: 1
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 5,
    overflow: 'hidden',
    margin: -5,
    marginTop: -30,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: Colors.black90,
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
    backgroundColor: Colors.white70,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#000',
  },
});