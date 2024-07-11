import { StyleSheet, Image } from 'react-native';

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