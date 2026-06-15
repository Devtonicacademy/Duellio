import { useState, useEffect } from 'react';
import { WalletTransaction, UserProfile } from '../types';
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

export function useWallet(userProfile: UserProfile | null) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Sync transactions from Firestore in real-time
  useEffect(() => {
    if (!userProfile) {
      setTransactions([]);
      return;
    }
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userProfile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txList: WalletTransaction[] = [];
      snapshot.forEach((docSnap) => {
        txList.push(docSnap.data() as WalletTransaction);
      });
      // Sort transactions by timestamp (using lexicographical compare of IDs/timestamps)
      setTransactions(txList.sort((a, b) => b.id.localeCompare(a.id)));
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleHeaderFaucet = async (
    user: UserProfile | null,
    setUserProfile: (value: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => void
  ) => {
    if (!user) return;
    const claimAmount = 1000;
    const newTx: WalletTransaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.uid,
      type: 'credit',
      amount: claimAmount,
      description: 'Lobby Header Faucet Credit Claim',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'completed'
    };

    try {
      // Update coins in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        coins: increment(claimAmount)
      });
      // Save transaction in Firestore
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
    } catch (e) {
      console.error("Faucet error:", e);
    }
  };

  const addTransaction = async (tx: WalletTransaction) => {
    try {
      await setDoc(doc(db, 'transactions', tx.id), tx);
    } catch (e) {
      console.error("Error adding transaction to Firestore:", e);
    }
  };

  return {
    transactions,
    setTransactions,
    handleHeaderFaucet,
    addTransaction
  };
}
