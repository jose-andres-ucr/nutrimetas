import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import { SessionContext } from '@/shared/LoginSession';
import RenderMessageImage from './renderMessageImage';
import RenderMessageVideo from './renderMessageVideo';

const RenderBubble = (props: any) => {

    const role = useContext(SessionContext)?.role
    const roleId = role == "patient" ? 2 : 1
   

    return (
        <View style={[ styles.bubble,
          props.currentMessage?.user._id === roleId ? styles.userBubble : styles.otherBubble
        ]} >
          {props.currentMessage?.text && (
            <Text style={styles.text}>{props.currentMessage.text}</Text>
          )}
          {props.currentMessage?.image && <RenderMessageImage {...props} />}
          {props.currentMessage?.video && <RenderMessageVideo {...props} />}
  
          {!props.currentMessage?.image && !props.currentMessage?.video && (
            <Text style={styles.timestamp}>
              {props.currentMessage?.createdAt
                ? new Date(props.currentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </Text>
          )}
        </View>
      );
}

export default RenderBubble

const styles = StyleSheet.create({
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
});