import React, { useState } from 'react';
import { WalletService } from '../services/wallet';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, userId }) => {
  const [amount, setAmount] = useState<number>(1000);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTopUp = async () => {
    setLoading(true);
    try {
      // Mocking Paystack integration
      const mockReferenceId = `paystack_mock_${Date.now()}`;
      
      // In a real app, you would initialize Paystack here, and ON SUCCESS do the following:
      await WalletService.createTransaction(
        userId,
        'deposit',
        amount,
        'Virtual Coin Top-Up (Paystack Mock)',
        mockReferenceId
      );
      
      alert(`Successfully simulated top-up of ${amount} coins!`);
      onClose();
    } catch (error) {
      console.error('Failed to top up:', error);
      alert('Top-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-green-600 p-4 text-white">
          <h2 className="text-xl font-bold">Top Up Coins</h2>
          <p className="text-sm opacity-90">Purchase virtual coins to play.</p>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`py-2 px-4 rounded-lg border-2 font-bold transition-colors ${
                  amount === preset 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                {preset} 🪙
              </button>
            ))}
          </div>

          <button
            onClick={handleTopUp}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay with Paystack`}
          </button>
          
          <button
            onClick={onClose}
            className="w-full mt-3 text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
