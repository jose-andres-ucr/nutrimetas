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

const RenderAvatar = (props: any) => {
  return (
    <Image
      source={{ uri: props.currentMessage?.user.avatar as string }}
      style={styles.avatar}
    />
  );
}

export default RenderAvatar

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});