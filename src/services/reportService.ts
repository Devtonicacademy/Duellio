import { UserReport } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export class ReportService {
  /**
   * Submits a user report.
   */
  static async submitReport(
    reporterId: string,
    reportedUserId: string,
    reason: UserReport['reason'],
    description?: string
  ): Promise<string> {
    const reportData = {
      reporterId,
      reportedUserId,
      reason,
      description: description || null,
      status: 'pending',
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'user_reports'), reportData);
    return docRef.id;
  }
}
