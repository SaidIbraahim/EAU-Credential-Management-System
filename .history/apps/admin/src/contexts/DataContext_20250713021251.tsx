import React, { createContext, useContext, useEffect } from 'react';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import { facultiesApi, departmentsApi, academicYearsApi } from '@/api/apiClient';
import { Faculty, Department, AcademicYear } from '@/types';
import { 
  CACHE_KEYS, 
  ACADEMIC_CACHE_CONFIG,
  invalidateAcademicCache 
} from '@/lib/cacheConfig';

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
  
  // Cache invalidation
  invalidateAllAcademicCache: () => void;
  
  // Utility functions
  getFacultyById: (id: number) => Faculty | undefined;
  getDepartmentById: (id: number) => Department | undefined;
  getAcademicYearById: (id: number) => AcademicYear | undefined;
  getDepartmentsByFacultyId: (facultyId: number) => Department[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // 🚀 STANDARDIZED CACHE KEYS - CRITICAL FIX for real-time updates
  const {
    data: faculties,
    isLoading: facultiesLoading,
    refetch: refetchFaculties,
  } = useOptimizedData(
    () => facultiesApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.FACULTIES,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const {
    data: departments,
    isLoading: departmentsLoading,
    refetch: refetchDepartments,
  } = useOptimizedData(
    () => departmentsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.DEPARTMENTS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const {
    data: academicYears,
    isLoading: academicYearsLoading,
    refetch: refetchAcademicYears,
  } = useOptimizedData(
    () => academicYearsApi.getAll(),
    { 
      cacheKey: CACHE_KEYS.ACADEMIC_YEARS,
      ...ACADEMIC_CACHE_CONFIG
    }
  );

  const isLoading = facultiesLoading || departmentsLoading || academicYearsLoading;

  // 🚀 CACHE INVALIDATION FUNCTION - Ensures real-time updates
  const invalidateAllAcademicCache = () => {
    console.log('🗑️ DataContext: Invalidating all academic caches for real-time updates');
    invalidateAcademicCache();
  };

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
    
    // Cache invalidation
    invalidateAllAcademicCache,
    
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