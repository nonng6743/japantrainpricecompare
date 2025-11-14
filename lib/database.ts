// Shared database for users
export interface User {
  id: number
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  lastLogin?: string | null
  createdAt: string
}

// Mock users database (ในการใช้งานจริงควรเชื่อมต่อกับ database)
export let users: User[] = [
  { 
    id: 1, 
    username: 'admin', 
    email: 'admin@example.com',
    password: 'admin123', 
    role: 'admin', 
    firstName: 'ผู้ดูแล',
    lastName: 'ระบบ',
    lastLogin: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 2, 
    username: 'user', 
    email: 'user@example.com',
    password: 'user123', 
    role: 'user', 
    firstName: 'ผู้ใช้',
    lastName: 'ทั่วไป',
    lastLogin: null,
    createdAt: new Date().toISOString()
  },
]

export let nextId = 3
