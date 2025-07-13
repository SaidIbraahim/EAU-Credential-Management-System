import { useState, useCallback } from 'react';
import { VerificationResult, VerificationResponse } from '../types';
import { VerificationApi } from '../services/api';

interface UseVerificationResult {
  result: VerificationResult | null;
  isLoading: boolean;
  error: string | null;
  verify: (query: string) => Promise<void>;
  reset: () => void;
}

export const useVerification = (): UseVerificationResult => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a Certificate Number or Registration Number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response: VerificationResponse = await VerificationApi.verifyStudent(query);
      
      if (response.success && response.student) {
        const verificationResult: VerificationResult = {
          student: response.student,
          verificationDate: new Date().toISOString(),
          isValid: true,
        };
        setResult(verificationResult);
      } else {
        setError(response.message || 'No result found for the ID provided');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('An error occurred while verifying the certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    isLoading,
    error,
    verify,
    reset,
  };
}; 