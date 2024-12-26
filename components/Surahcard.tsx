import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SurahCardProps {
  number: number;
  name: string;
  translation: string;
  ayahCount: number;
  type: string; // "Meccan" or "Medinan"
  namaLatin: string;
}

const SurahCard: React.FC<SurahCardProps> = ({ number, name, translation, ayahCount, type, namaLatin }) => {
  return (
    <View style={styles.card}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{number}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name} - {namaLatin}</Text>
        <Text style={styles.details}>{type}, {ayahCount} Ayah</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', // Arrange number and text horizontally
    alignItems: 'center', // Vertically align items
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 16, // Rounded corners
    padding: 16, // Padding inside the card
    marginBottom: 8, // Spacing between cards
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 16, // Add horizontal margin
  },
  numberContainer: {
    backgroundColor: '#E0F2F7', // Light blue background for number
    borderRadius: 20, // Circular shape
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16, // Spacing between number and text
  },
  number: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green', // Blue color for number
  },
  textContainer: {
    flex: 1, // Allow text to take up available space
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  details: {
    fontSize: 14,
    color: '#777777',
  },
});

export default SurahCard;