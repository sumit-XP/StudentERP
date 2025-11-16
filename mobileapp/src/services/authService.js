import { authentication, db, collections } from '../config/firebase';

class AuthService {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await authentication.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update last login time
      await db.collection(collections.users).doc(user.uid).update({
        lastLoginAt: new Date(),
      });
      
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign up with email and password
  async signUp(email, password, userData) {
    try {
      const userCredential = await authentication.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await db.collection(collections.users).doc(user.uid).set({
        email: user.email,
        displayName: userData.displayName || '',
        role: userData.role || 'parent',
        phone: userData.phone || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        studentIds: userData.studentIds || [], // For parents
      });
      
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await authentication.signOut();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return authentication.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid) {
    try {
      const userDoc = await db.collection(collections.users).doc(uid).get();
      if (userDoc.exists) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      await db.collection(collections.users).doc(uid).update({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await authentication.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return authentication.onAuthStateChanged(callback);
  }

  // Handle authentication errors
  handleAuthError(error) {
    let message = 'An error occurred during authentication';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No user found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'Email address is already in use';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}

export default new AuthService();
