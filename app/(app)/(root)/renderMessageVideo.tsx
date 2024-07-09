import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import Video from "react-native-video"

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
    marginRight: 5,
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