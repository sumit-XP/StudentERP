import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import Config from 'react-native-config';

// Firebase configuration is automatically loaded from google-services.json
// No need to initialize Firebase app manually in React Native Firebase v6+

export const db = firestore();
export const authentication = auth();
export const fcm = messaging();

// Collections
export const collections = {
  users: 'users',
  students: 'students',
  guardians: 'guardians',
  attendance: 'attendance',
  academicRecords: 'academicRecords',
  notifications: 'notifications',
  activityLogs: 'activityLogs',
  classes: 'classes',
  subjects: 'subjects',
};

// API base URL for Cloud Functions
export const API_BASE_URL = Config.API_BASE_URL || 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api';

// Request FCM permission and get token
export const requestFCMPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('FCM Permission Error:', error);
    return null;
  }
};

// Subscribe to FCM topic
export const subscribeToTopic = async (topic) => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('Topic subscription error:', error);
  }
};

// Unsubscribe from FCM topic
export const unsubscribeFromTopic = async (topic) => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error('Topic unsubscription error:', error);
  }
};

export default {
  db,
  authentication,
  fcm,
  collections,
  API_BASE_URL,
  requestFCMPermission,
  subscribeToTopic,
  unsubscribeFromTopic,
};
