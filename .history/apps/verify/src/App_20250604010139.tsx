import React, { useEffect } from 'react';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import ResultSection from './components/ResultSection';
import PrintSection from './components/PrintSection';
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
    <div className="min-h-screen bg-[#2c2484] bg-opacity-5">
      {/* Main Header */}
      <Header />
      
      {/* Print Header (hidden on screen, visible when printing) */}
      <Header showPrintableHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Portal Title */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2c2484] mb-2">
            CERTIFICATE VERIFICATION PORTAL
          </h1>
          <p className="text-gray-600 text-lg">
            Verify the authenticity of East Africa University certificates
          </p>
        </div>

        {/* Search Section - Hide when result is shown */}
        {!result && (
          <SearchSection 
            onSearch={verify}
            isLoading={isLoading}
            error={error}
          />
        )}

        {/* Results Section */}
        {result && (
          <>
            {/* New Search Button */}
            <div className="text-center mb-6 no-print">
              <button
                onClick={handleNewSearch}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Search Another Certificate
              </button>
            </div>

            {/* Verification Result */}
            <ResultSection 
              result={result}
              onPrint={handlePrint}
            />

            {/* Print Section (hidden on screen, visible when printing) */}
            <PrintSection result={result} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#2c2484] text-white py-6 mt-12 no-print">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 East Africa University - Garowe Campus. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-blue-200">
            For technical support, contact: support@eaugarowe.edu.so
          </p>
        </div>
      </footer>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            
            .print-header {
              display: block !important;
            }
            
            body {
              background: white !important;
            }
            
            .container {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default App;