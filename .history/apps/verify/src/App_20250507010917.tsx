import React, { useState } from 'react';
import { Search, Loader2, GraduationCap, AlertCircle, Printer } from 'lucide-react';

interface VerificationResult {
  certificate_number: string;
  registration_number: string;
  full_name: string;
  gender: 'Male' | 'Female';
  academic_year: string;
  graduation_date: string;
  faculty: string;
  department: string;
  gpa: number;
  grade: string;
  photo_url: string;
}

const mockData: Record<string, VerificationResult> = {
  '1245': {
    certificate_number: '1245',
    registration_number: 'GRW-BCS-2005',
    full_name: 'Ahmed Mohamed Hassan',
    gender: 'Male',
    academic_year: '2019-2020',
    graduation_date: '2020-07-15',
    faculty: 'Computing and Information Technology',
    department: 'Computer Science',
    gpa: 3.85,
    grade: 'A',
    photo_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=500'
  },
  'GRW-BCS-2005': {
    certificate_number: '1245',
    registration_number: 'GRW-BCS-2005',
    full_name: 'Ahmed Mohamed Hassan',
    gender: 'Male',
    academic_year: '2019-2020',
    graduation_date: '2020-07-15',
    faculty: 'Computing and Information Technology',
    department: 'Computer Science',
    gpa: 3.85,
    grade: 'A',
    photo_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=500'
  },
  'GRW-BBA-2006': {
    certificate_number: '1246',
    registration_number: 'GRW-BBA-2006',
    full_name: 'Aisha Omar Ali',
    gender: 'Female',
    academic_year: '2020-2021',
    graduation_date: '2021-07-20',
    faculty: 'Business and Economics',
    department: 'Business Administration',
    gpa: 3.92,
    grade: 'A',
    photo_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=500'
  },
  'GRW-BEE-2007': {
    certificate_number: '1247',
    registration_number: 'GRW-BEE-2007',
    full_name: 'Mohamed Abdi Farah',
    gender: 'Male',
    academic_year: '2021-2022',
    graduation_date: '2022-07-10',
    faculty: 'Engineering',
    department: 'Electrical Engineering',
    gpa: 3.78,
    grade: 'A',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500'
  }
};

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!input.trim()) {
      setError('Please enter a Certificate Number or Registration Number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const mockResult = mockData[input];
      if (mockResult) {
        setResult(mockResult);
      } else {
        throw new Error('No result found');
      }
    } catch (err: any) {
      setError('No result found for the ID provided');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#2c2484] bg-opacity-5">
      {/* Header */}
      <div className="bg-[#2c2484] shadow-sm no-print">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* <img 
                src="https://i.ibb.co/Jk8FPx1/logo.png" 
                alt="EAU Logo" 
                className="w-16 h-16"
              /> */}
              <div>
                <h1 className="text-xl font-bold text-white">EAST AFRICA UNIVERSITY - GAROWE CAMPUS</h1>
              </div>
            </div>
            <a 
              href="https://eaugarowe.edu.so/" 
              className="px-4 py-2 bg-white text-[#2c2484] rounded-md hover:bg-opacity-90 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              University Website
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Portal Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#2c2484] text-center mb-8 no-print">
          CERTIFICATE VERIFICATION PORTAL
        </h1>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-4 no-print">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-[#2c2484] mb-4">Verify Certificate</h2>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                id="verificationId"
                className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c2484] focus:border-transparent text-sm md:text-base"
                placeholder="Enter Certificate Number or Registration No (e.g GRW-BCS-2005)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full md:w-auto md:self-end px-5 py-3 bg-[#2c2484] text-white rounded-md hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Verify Now
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-[#e41014] bg-opacity-5 rounded-lg flex items-center gap-2 text-[#e41014]">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold mb-2">Instructions:</p>
              
              <p className="text-sm text-gray-600 mb-2">You can verify a certificate using either:</p>
              
              <p className="text-sm text-gray-600 mb-1 pl-2">• A student Registration Number (e.g. GRW-BCS-2005)</p>
              <p className="text-sm text-gray-600 mb-3 pl-2">• A Certificate Number shown on the certificate (e.g 4585)</p>
              
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold">Note:</span> Currently you can verify only the certificates issued after October 17, 2025
              </p>
              
              <div className="mt-1 border-t border-blue-100 pt-3">
                <p className="text-sm text-gray-600 font-semibold mb-1">Institution Grading Policy:</p>
                <div className="flex text-sm text-gray-600 mb-1">
                  <span className="font-medium w-6">A:</span>
                  <span>3.50 - 4.00</span>
                </div>
                <div className="flex text-sm text-gray-600 mb-1">
                  <span className="font-medium w-6">B:</span>
                  <span>3.00 - 3.49</span>
                </div>
                <div className="flex text-sm text-gray-600 mb-1">
                  <span className="font-medium w-6">C:</span>
                  <span>2.50 - 2.99</span>
                </div>
                <div className="flex text-sm text-gray-600">
                  <span className="font-medium w-6">D:</span>
                  <span>2.00 - 2.49</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="max-w-2xl mx-auto bg-white rounded-md shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="flex items-center justify-end p-3 border-b">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#09c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors no-print"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
            
            {/* Main content */}
            <div>
              {/* Photo section */}
              <div className="flex justify-center items-center py-6 border-b">
                {result.photo_url && (
                  <img
                    src={result.photo_url}
                    alt={result.full_name}
                    className="h-28 w-28 object-cover rounded-sm border border-gray-100 shadow-sm"
                  />
                )}
              </div>
              
              {/* Data table with borders */}
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="py-2.5 px-6 text-right w-1/2 border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Certificate Number</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">
                      <span className="text-[#d30000] font-medium">{result.certificate_number}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Registration Number</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.registration_number}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Full Name</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.full_name}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Gender</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.gender}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Faculty</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.faculty}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Department</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.department}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Academic Year</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.academic_year}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Graduation Date</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.graduation_date}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">GPA</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.gpa}/4.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-6 text-right border border-gray-200 bg-gray-50">
                      <span className="font-medium text-[#20396b]">Grade</span>
                    </td>
                    <td className="py-2.5 px-6 border border-gray-200">{result.grade}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Print-only elements */}
      <div className="hidden print:block print-header">
        <div className="flex justify-center mb-4">
          <img 
            src="https://i.ibb.co/Jk8FPx1/logo.png" 
            alt="EAU Logo" 
            className="w-20 h-20"
          />
        </div>
        <h1 className="text-2xl font-bold text-center text-[#2c2484]">EAU GAROWE CAMPUS</h1>
        <h2 className="text-xl font-semibold text-center text-[#2c2484] mt-2">OFFICIAL CERTIFICATE VERIFICATION</h2>
        <div className="border-t-2 border-b-2 border-[#2c2484] my-4 py-2">
          <p className="text-center text-sm">This document is an official verification from East Africa University</p>
        </div>
      </div>
    </div>
  );
}

export default App;