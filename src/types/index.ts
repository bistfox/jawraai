export interface User {
  uid: string;
  email?: string | null;
  username?: string;
  age?: number;
  gender?: 'Male' | 'Female';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}
