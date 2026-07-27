import { useState, useEffect } from 'react';
import { WalletTransaction, UserProfile } from '../types';
import { db, sanitizeForFirestore } from '../firebase';
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: WalletTransaction[] = [];
      snapshot.forEach((docSnap) => {
        txs.push(docSnap.data() as WalletTransaction);
      });
      // Sort newest first
      txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore transactions listener warning:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleClaimFaucet = async (user: UserProfile, claimAmount: number = 250) => {
    const newTx: WalletTransaction = {
      id: `TX-FAUCET-${Math.floor(100000 + Math.random() * 900000)}`,
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
      await setDoc(doc(db, 'transactions', newTx.id), sanitizeForFirestore(newTx));
    } catch (e) {
      console.error("Faucet error:", e);
    }
  };

  const addTransaction = async (tx: WalletTransaction) => {
    try {
      await setDoc(doc(db, 'transactions', tx.id), sanitizeForFirestore(tx));
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
