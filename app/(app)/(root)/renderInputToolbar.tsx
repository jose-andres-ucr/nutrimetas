import { StyleSheet } from 'react-native';
import { InputToolbar } from 'react-native-gifted-chat';
import Colors from '@/constants/Colors';

const RenderInputToolbar = (props: any) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={styles.containerchatBar}
    />
  );
}

export default RenderInputToolbar

const styles = StyleSheet.create({
  containerchatBar: {
    borderRadius: 5,
    width: '90%',
    marginHorizontal: 20,
    borderBlockColor: Colors.white,
  },
});