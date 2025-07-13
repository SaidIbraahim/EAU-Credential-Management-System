export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role?: 'ADMIN' | 'SUPER_ADMIN';
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
} 