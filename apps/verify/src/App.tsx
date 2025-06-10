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
    // Mobile-friendly print handling
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile devices, we need to use a different approach
      // First, let's try the standard print method
      try {
        // Ensure print section is visible momentarily
        const printSection = document.querySelector('.print-page') as HTMLElement;
        if (printSection) {
          printSection.style.display = 'block';
          printSection.style.position = 'fixed';
          printSection.style.top = '0';
          printSection.style.left = '0';
          printSection.style.width = '100vw';
          printSection.style.height = '100vh';
          printSection.style.zIndex = '9999';
          printSection.style.backgroundColor = 'white';
          printSection.style.overflow = 'auto';
          
          // Force a brief delay to ensure styles are applied
          setTimeout(() => {
            window.print();
            
            // Restore original styles after print dialog
            setTimeout(() => {
              printSection.style.display = '';
              printSection.style.position = '';
              printSection.style.top = '';
              printSection.style.left = '';
              printSection.style.width = '';
              printSection.style.height = '';
              printSection.style.zIndex = '';
              printSection.style.backgroundColor = '';
              printSection.style.overflow = '';
            }, 100);
          }, 100);
        } else {
          // Fallback to regular print
          window.print();
        }
      } catch (error) {
        console.error('Print failed:', error);
        // Last resort - regular print
        window.print();
      }
    } else {
      // Desktop - use regular print
      window.print();
    }
  };

  const handleNewSearch = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen-only content - hidden during print */}
      <div className="no-print">
        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Portal Title and Instructions - Hide when result is shown */}
          {!result && (
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2c2484] mb-2 sm:mb-3 px-2">
                Certificate Verification Portal
              </h1>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4 leading-relaxed">
                Verify the authenticity of certificates issued by East Africa University - Garowe Campus. 
                Enter a certificate number or registration ID to get started.
              </p>
            </div>
          )}

          {/* Search Section - Hide when result is shown */}
          {!result && (
            <div className="max-w-4xl mx-auto">
              <SearchSection 
                onSearch={verify} 
                isLoading={isLoading} 
                error={error || undefined} 
              />
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="max-w-2xl lg:max-w-3xl mx-auto">
              {/* New Search Button */}
              <div className="text-center mb-4 sm:mb-6">
                <button
                  onClick={handleNewSearch}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base font-medium"
                >
                  Search Another Certificate
                </button>
              </div>
              
              {/* Verification Result */}
              <ResultSection 
                result={result} 
                onPrint={handlePrint}
              />
            </div>
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