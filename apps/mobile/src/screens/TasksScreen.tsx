import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tasks Screen</Text>
      <Text style={styles.subtext}>Task management coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});