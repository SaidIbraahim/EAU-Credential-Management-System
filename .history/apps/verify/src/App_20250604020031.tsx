import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { SearchSection } from './components/SearchSection';
import { ResultSection } from './components/ResultSection';
import { PrintSection } from './components/PrintSection';
import { useVerification } from './hooks/useVerification';
import { VerificationApi } from './services/api';

const App: React.FC = () => {
  const { result, isLoading, error, verify, reset } = useVerification();

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      const isHealthy = await VerificationApi.healthCheck();
      if (!isHealthy) {
        console.warn('Backend API is not responding. Verification may not work properly.');
      }
    };
    
    checkApiHealth();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleNewSearch = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen-only content - hidden during print */}
      <div className="no-print">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2c2484] mb-2">
              Certificate Verification Portal
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verify the authenticity of certificates issued by East Africa University - Garowe Campus. 
              Enter a certificate number or registration ID to get started.
            </p>
          </div>

          <SearchSection 
            onSearch={verify} 
            isLoading={isLoading} 
            error={error} 
          />

          {result && (
            <ResultSection 
              result={result} 
              onPrint={handlePrint}
            />
          )}
        </main>
      </div>

      {/* Print-only content */}
      {result && (
        <PrintSection result={result} />
      )}
    </div>
  );
};

export default App;