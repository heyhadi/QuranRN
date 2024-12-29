import React from 'react';
import { View } from 'react-native';
import { QiblaFinder } from 'react-native-qibla-finder';

export default function Home() {
    return (
        <View style={{ flex: 1 }}>
        <QiblaFinder />
        </View>
    );
   

}
