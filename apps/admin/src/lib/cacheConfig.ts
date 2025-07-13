/**
 * 🚀 CENTRALIZED CACHE CONFIGURATION
 * Standardizes all cache keys and provides unified cache management
 * Fixes the Academic Config real-time update issue
 */

import { clearCachePattern } from '@/hooks/useOptimizedData';

// ===== STANDARDIZED CACHE KEYS =====
export const CACHE_KEYS = {
  // Academic Data
  FACULTIES: 'faculties',
  DEPARTMENTS: 'departments', 
  ACADEMIC_YEARS: 'academic-years',
  
  // Student Data
  STUDENTS: 'students',
  STUDENT_VALIDATION: 'student-validation',
  
  // Dashboard Data
  DASHBOARD_STATS: 'dashboard-stats',
  QUICK_STATS: 'quick-stats',
  
  // Audit Data
  AUDIT_LOGS: 'audit-logs',
  
  // Document Data
  DOCUMENTS: 'documents',
} as const;

// ===== CACHE INVALIDATION PATTERNS =====
export const CACHE_PATTERNS = {
  // Academic patterns (clears all academic-related caches)
  ACADEMIC_ALL: ['faculties', 'departments', 'academic-years', 'global-faculties', 'global-departments', 'global-academic-years'],
  FACULTIES: ['faculties', 'global-faculties'],
  DEPARTMENTS: ['departments', 'global-departments'],
  ACADEMIC_YEARS: ['academic-years', 'academic_years', 'academicYears', 'global-academic-years'],
  
  // Student patterns
  STUDENTS_ALL: ['students', 'student-validation'],
  
  // Dashboard patterns
  DASHBOARD_ALL: ['dashboard-stats', 'quick-stats'],
} as const;

// ===== UNIFIED CACHE INVALIDATION FUNCTIONS =====

/**
 * Clear all academic-related caches
 * Use this when any academic entity is created/updated/deleted
 */
export const invalidateAcademicCache = () => {
  console.log('🗑️ Clearing all academic caches...');
  CACHE_PATTERNS.ACADEMIC_ALL.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

/**
 * Clear faculty-related caches
 */
export const invalidateFacultyCache = () => {
  console.log('🗑️ Clearing faculty caches...');
  CACHE_PATTERNS.FACULTIES.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

/**
 * Clear department-related caches
 */
export const invalidateDepartmentCache = () => {
  console.log('🗑️ Clearing department caches...');
  CACHE_PATTERNS.DEPARTMENTS.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

/**
 * Clear academic year-related caches
 */
export const invalidateAcademicYearCache = () => {
  console.log('🗑️ Clearing academic year caches...');
  CACHE_PATTERNS.ACADEMIC_YEARS.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

/**
 * Clear student-related caches
 */
export const invalidateStudentCache = () => {
  console.log('🗑️ Clearing student caches...');
  CACHE_PATTERNS.STUDENTS_ALL.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

/**
 * Clear dashboard-related caches
 */
export const invalidateDashboardCache = () => {
  console.log('🗑️ Clearing dashboard caches...');
  CACHE_PATTERNS.DASHBOARD_ALL.forEach(pattern => {
    clearCachePattern(pattern);
  });
};

// ===== CACHE CONFIGURATION PRESETS =====

/**
 * Standard cache configuration for academic data
 */
export const ACADEMIC_CACHE_CONFIG = {
  cacheExpiry: 10 * 60 * 1000, // 10 minutes
  staleWhileRevalidate: true,
  backgroundRefresh: true
};

/**
 * Short-lived cache configuration for frequently changing data
 */
export const SHORT_CACHE_CONFIG = {
  cacheExpiry: 2 * 60 * 1000, // 2 minutes
  staleWhileRevalidate: true,
  backgroundRefresh: true
};

/**
 * Long-lived cache configuration for stable data
 */
export const LONG_CACHE_CONFIG = {
  cacheExpiry: 30 * 60 * 1000, // 30 minutes
  staleWhileRevalidate: true,
  backgroundRefresh: false
}; 