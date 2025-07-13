
import { User } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    username: 'super_admin',
    role: 'super_admin',
    created_at: new Date(),
    updated_at: new Date()
  }
];
