export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  email: string;
  role?: 'ADMIN' | 'SUPER_ADMIN';
}

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
} 