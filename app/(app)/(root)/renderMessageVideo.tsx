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

const RenderMessageVideo = (props: any) => {
  return (
    <View style={styles.videoContainer}>
      <Video
        source={{ uri: props.currentMessage.video }}
        style={styles.messageVideo}
        controls={true}
        resizeMode="cover"
      />
      <Text style={styles.timestampImage}>
      {props.currentMessage?.createdAt
        ? new Date(props.currentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : ''}
      </Text>
    </View>
  );
}

export default RenderMessageVideo

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
  videoContainer: {
    width: 250,
    height: 250,
    borderRadius: 5,
    overflow: 'hidden',
    margin: -5,
  },
  messageVideo: {
    width: '100%',
    height: '100%',
  },
});