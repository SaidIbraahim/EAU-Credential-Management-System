import React, { createContext, useContext, useEffect } from 'react';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { facultiesApi, departmentsApi, academicYearsApi } from '@/api/apiClient';
import { Faculty, Department, AcademicYear } from '@/types';

interface DataContextType {
  // Data
  faculties: Faculty[] | null;
  departments: Department[] | null;
  academicYears: AcademicYear[] | null;
  
  // Loading states
  facultiesLoading: boolean;
  departmentsLoading: boolean;
  academicYearsLoading: boolean;
  
  // Overall loading state
  isLoading: boolean;
  
  // Refetch functions
  refetchFaculties: () => Promise<Faculty[]>;
  refetchDepartments: () => Promise<Department[]>;
  refetchAcademicYears: () => Promise<AcademicYear[]>;
  
  // Utility functions
  getFacultyById: (id: number) => Faculty | undefined;
  getDepartmentById: (id: number) => Department | undefined;
  getAcademicYearById: (id: number) => AcademicYear | undefined;
  getDepartmentsByFacultyId: (facultyId: number) => Department[];
}

const DataContext = createContext<DataContextType | null>(null);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Preload all academic configuration data with long cache times
  const {
    data: faculties,
    isLoading: facultiesLoading,
    refetch: refetchFaculties,
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: 'global-faculties',
      cacheExpiry: 30 * 60 * 1000, // 30 minutes cache
      staleWhileRevalidate: true,
      backgroundRefresh: false, // Disable to reduce unnecessary requests
      retryOnError: false
    }
  );

  const {
    data: departments,
    isLoading: departmentsLoading,
    refetch: refetchDepartments,
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { 
      cacheKey: 'global-departments',
      cacheExpiry: 30 * 60 * 1000, // 30 minutes cache
      staleWhileRevalidate: true,
      backgroundRefresh: false, // Disable to reduce unnecessary requests
      retryOnError: false
    }
  );

  const {
    data: academicYears,
    isLoading: academicYearsLoading,
    refetch: refetchAcademicYears,
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { 
      cacheKey: 'global-academic-years',
      cacheExpiry: 30 * 60 * 1000, // 30 minutes cache
      staleWhileRevalidate: true,
      backgroundRefresh: false, // Disable to reduce unnecessary requests
      retryOnError: false
    }
  );

  const isLoading = facultiesLoading || departmentsLoading || academicYearsLoading;

  // Utility functions
  const getFacultyById = (id: number): Faculty | undefined => {
    return faculties?.find(f => f.id === id);
  };

  const getDepartmentById = (id: number): Department | undefined => {
    return departments?.find(d => d.id === id);
  };

  const getAcademicYearById = (id: number): AcademicYear | undefined => {
    return academicYears?.find(ay => ay.id === id);
  };

  const getDepartmentsByFacultyId = (facultyId: number): Department[] => {
    return departments?.filter(d => d.facultyId === facultyId) || [];
  };

  const contextValue: DataContextType = {
    // Data
    faculties: faculties || null,
    departments: departments || null,
    academicYears: academicYears || null,
    
    // Loading states
    facultiesLoading,
    departmentsLoading,
    academicYearsLoading,
    isLoading,
    
    // Refetch functions
    refetchFaculties,
    refetchDepartments,
    refetchAcademicYears,
    
    // Utility functions
    getFacultyById,
    getDepartmentById,
    getAcademicYearById,
    getDepartmentsByFacultyId,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}; 