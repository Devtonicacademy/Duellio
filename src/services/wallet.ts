import { WalletTransaction } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export class WalletService {
  /**
   * Proposes a new wallet transaction. 
   * In a real secure environment, this would call a Firebase Cloud Function.
   */
  static async createTransaction(
    userId: string, 
    type: WalletTransaction['type'], 
    amount: number, 
    description: string,
    referenceId?: string,
    idempotencyKey?: string
  ): Promise<string> {
    const transactionData = {
      userId,
      type,
      amount,
      description,
      status: 'pending',
      referenceId: referenceId || null,
      idempotencyKey: idempotencyKey || null,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'wallet_transactions'), transactionData);
    return docRef.id;
  }

  /**
   * Retrieves user's real balance from the users collection
   */
  static async getBalance(userId: string): Promise<number> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data()?.coins || 0;
    }
    return 0;
  }
}
