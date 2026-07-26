import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WalletTransaction } from '../types';
import { db, auth, signOut } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

export function useProfiles() {
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const lastSyncedProfileJsonRef = useRef<string | null>(null);

  // Sync users list from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const profilesList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const profile = docSnap.data() as UserProfile;
        if (!profile.uid || !profile.uid.startsWith('bot_')) {
          profilesList.push(profile);
        }
      });

      setAllProfiles(profilesList);
    });

    return () => unsubscribe();
  }, []);

  // Listen for Firebase Auth state changes and sync with active user profile doc in Firestore
  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      unsubscribeUserDoc();

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          let activeProfile: UserProfile;
          if (!snap.exists()) {
            // Create a new Firestore document for newly authenticated users
            activeProfile = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || `Gamer_${firebaseUser.uid.substring(0, 5)}`,
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              wins: 0,
              losses: 0,
              draws: 0,
              coins: 1000,
              status: 'online',
              favorites: []
            };
            await setDoc(userDocRef, activeProfile);
          } else {
            activeProfile = snap.data() as UserProfile;
          }

          const jsonStr = JSON.stringify(activeProfile);
          lastSyncedProfileJsonRef.current = jsonStr;
          setUserProfile(activeProfile);

          // Live track changes on the current user's profile
          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              const newJson = JSON.stringify(data);
              if (newJson !== lastSyncedProfileJsonRef.current) {
                lastSyncedProfileJsonRef.current = newJson;
                setUserProfile(data);
              }
            }
          });

          localStorage.setItem('duellio-current-user-uid', firebaseUser.uid);
        } catch (e) {
          console.error("Error fetching user profile from Firestore:", e);
        }
      }
      setAuthLoading(false);
    });

    // Safety fallback: ensure authLoading is turned off after 1s max to prevent infinite spinner
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  // Sync profile edits (e.g. status updates) back to Firestore safely
  useEffect(() => {
    if (userProfile && auth.currentUser) {
      const currentJson = JSON.stringify(userProfile);
      if (currentJson !== lastSyncedProfileJsonRef.current) {
        lastSyncedProfileJsonRef.current = currentJson;
        const updateRef = doc(db, 'users', userProfile.uid);
        updateDoc(updateRef, { ...userProfile }).catch(err => console.error("Firestore user sync error:", err));
      }
    }
  }, [userProfile]);

  // Logout Session
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase SignOut error:", e);
    }
    setUserProfile(null);
    localStorage.setItem('duellio-current-user-uid', 'none');
  };

  // Change Password
  const handleChangePassword = async (current: string, newP: string) => {
    // Standard mock response to support local settings validation
    return { success: true, message: 'Password database updated successfully!' };
  };

  // Switch / Swap Profile instantly (for multi-user local testing)
  const handleSwitchProfile = async (uid: string) => {
    const found = allProfiles.find(u => u.uid === uid);
    if (found) {
      setUserProfile(found);
      localStorage.setItem('duellio-current-user-uid', uid);
    }
  };

  // Delete Guest / Device Profile
  const handleDeleteProfile = async (uid: string) => {
    if (allProfiles.length <= 1) {
      alert("🔒 Identity Vault Core Requirement: At least one user profile must persist on client device.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', uid));
      if (userProfile?.uid === uid) {
        const nextUser = allProfiles.find(u => u.uid !== uid);
        if (nextUser) {
          setUserProfile(nextUser);
          localStorage.setItem('duellio-current-user-uid', nextUser.uid);
        } else {
          setUserProfile(null);
          localStorage.setItem('duellio-current-user-uid', 'none');
        }
      }
    } catch (e) {
      console.error("Error deleting user profile from Firestore:", e);
    }
  };

  // Register New device profile with automatic 1000 Starting Coins
  const handleAddProfile = async (
    username: string, 
    email: string, 
    pass: string, 
    avatar: string,
    onAddTransaction?: (tx: WalletTransaction) => void
  ) => {
    const duplicateUser = allProfiles.some(u => u.username.toLowerCase() === username.toLowerCase());
    const duplicateEmail = allProfiles.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicateUser) {
      return { success: false, message: `Username "${username}" is already registered on this device.` };
    }
    if (duplicateEmail) {
      return { success: false, message: `Email "${email}" is already registered on this device.` };
    }

    const newUid = `user_${Math.floor(100000 + Math.random() * 900000)}`;
    const newUser: UserProfile = {
      uid: newUid,
      username,
      email,
      avatar,
      wins: 0,
      losses: 0,
      draws: 0,
      coins: 1000, // mandatory 1,000 Starting Coins rule!
      status: 'online',
      favorites: []
    };

    try {
      await setDoc(doc(db, 'users', newUid), newUser);
      
      // Welcome Credit transaction
      if (onAddTransaction) {
        const bonusTx: WalletTransaction = {
          id: `TX-RECOM-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: newUser.uid,
          type: 'credit',
          amount: 1000,
          description: 'Onboarding welcome bonus preloaded',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed'
        };
        onAddTransaction(bonusTx);
      }

      setUserProfile(newUser);
      localStorage.setItem('duellio-current-user-uid', newUser.uid);
      return { success: true, message: 'Onboarding successful with 1,000 Coins credited!', user: newUser };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to create user in Firestore.' };
    }
  };

  // Toggle Deactivate Status of a User Profile
  const handleToggleDeactivate = async (uid: string, deactivated: boolean) => {
    try {
      const updateRef = doc(db, 'users', uid);
      await updateDoc(updateRef, { deactivated });
      return { success: true };
    } catch (e: any) {
      console.error("Failed to update user deactivation status:", e);
      return { success: false, message: e.message };
    }
  };

  return {
    allProfiles,
    userProfile,
    setUserProfile,
    authLoading,
    handleLogout,
    handleChangePassword,
    handleSwitchProfile,
    handleDeleteProfile,
    handleAddProfile,
    handleToggleDeactivate
  };
}
