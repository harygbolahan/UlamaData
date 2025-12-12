import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export function ScreenWrapper({ children, edges = ['top', 'bottom', 'left', 'right'], style }) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
