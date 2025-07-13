# EAU Certificate Verification Portal

A modern, responsive web application for verifying the authenticity of East Africa University (Garowe Campus) certificates. This portal integrates with the backend API to provide real-time verification of student credentials.

## Features

### 🔍 Real-Time Verification
- **Multiple Search Methods**: Verify certificates using either:
  - Student Registration Number (e.g., `GRW-BCS-2005`)
  - Certificate Number (e.g., `1245`)
- **Backend Integration**: Real API calls to the credential management system
- **Comprehensive Data**: Displays complete student information including photos, academic details, and clearance status

### 🖨️ Professional Printing
- **Print-Optimized Layout**: Dedicated print stylesheet for official verification documents
- **University Branding**: Includes official logos and formatting
- **Verification Seal**: Official verification stamp with date and validity confirmation

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean Interface**: Professional styling that reflects university standards
- **Real-time Feedback**: Loading states, error handling, and success indicators
- **Accessibility**: Proper color contrast and keyboard navigation support

## Technical Architecture

### 📁 Project Structure
```
apps/verify/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # University header with branding
│   │   ├── SearchSection.tsx # Certificate search functionality
│   │   ├── ResultSection.tsx # Verification results display
│   │   └── PrintSection.tsx  # Print-optimized layout
│   ├── hooks/              # Custom React hooks
│   │   └── useVerification.ts # Verification state management
│   ├── services/           # API integration
│   │   └── api.ts          # Backend API communication
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared interfaces and types
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── README.md              # This documentation
```

### 🔧 Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Axios for API communication
- **State Management**: React hooks for local state

### 🔗 API Integration
The portal integrates with the backend credential system through:

```typescript
// API Base Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api'

// Verification Endpoints
GET /students                    # Fetch all students for search
GET /faculties                   # Get faculty information
GET /departments                 # Get department details  
GET /academic-years              # Get academic year data
GET /documents/student/:regId    # Fetch student documents/photos
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Backend API server running (see main project README)

### Local Development
1. **Install Dependencies**
   ```bash
   cd apps/verify
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env.local file (optional - defaults to localhost:3000)
   echo "VITE_API_URL=http://localhost:3000/api" > .env.local
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The portal will be available at `http://localhost:8082`

### Production Build
```bash
npm run build    # Creates optimized production build
npm run preview  # Preview production build locally
```

## Usage Guide

### For End Users
1. **Access the Portal**: Navigate to the verification portal URL
2. **Enter Credentials**: Input either:
   - Student registration number (format: GRW-XXX-YYYY)
   - Certificate number (4-digit number)
3. **View Results**: If valid, see complete verification details
4. **Print Verification**: Click "Print Verification" for official document

### For Administrators
- **API Health**: The portal automatically checks backend connectivity
- **Error Handling**: Comprehensive error messages for troubleshooting
- **Logging**: Console logs for debugging verification issues

## API Response Format

### Successful Verification
```typescript
{
  success: true,
  student: {
    id: 6,
    registrationId: "GRW-BCS-2010", 
    certificateId: "1245",
    fullName: "Sadia Abdullahi",
    gender: "FEMALE",
    faculty: { name: "Computing and Information Technology" },
    department: { name: "Computer Science" },
    academicYear: { academicYear: "2019-2020" },
    gpa: 3.85,
    grade: "A",
    graduationDate: "2020-07-15",
    status: "CLEARED",
    documents: [{ documentType: "PHOTO", presignedUrl: "..." }]
  }
}
```

### Verification Error
```typescript
{
  success: false,
  message: "No student found with the provided ID"
}
```

## Verification Features

### 📋 Displayed Information
- **Personal Details**: Full name, gender, registration number
- **Academic Information**: Faculty, department, academic year
- **Performance Data**: GPA, letter grade, graduation date
- **Status**: Clearance status (Cleared/Un-Cleared)
- **Photo**: Student photograph (if available)
- **Certificate Number**: Official certificate identifier

### 🛡️ Security & Validation
- **Input Validation**: Ensures proper format for registration/certificate numbers
- **API Timeouts**: 10-second timeout for API requests
- **Error Handling**: Graceful handling of network and server errors
- **Data Integrity**: Validates all received data before display

### 📱 Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Enhanced layout for tablet viewing
- **Desktop Enhanced**: Full-featured desktop experience
- **Print Optimization**: Dedicated print layout with university branding

## Integration with Main System

The verification portal is designed to work seamlessly with the main EAU credential system:

- **Shared Data Models**: Uses identical TypeScript interfaces
- **API Compatibility**: Designed for the same backend endpoints
- **Consistent Branding**: Matches university visual identity
- **Security**: Respects the same authentication and authorization patterns

## Support & Maintenance

### Troubleshooting
- **API Connection Issues**: Check backend server status and network connectivity
- **Search Failures**: Verify student data exists in the database
- **Print Problems**: Ensure browser allows printing and check print styles

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Print Support**: All major browsers with print capability

For technical issues or questions, contact the development team or refer to the main project documentation.

---

© 2024 East Africa University - Garowe Campus. All rights reserved. 