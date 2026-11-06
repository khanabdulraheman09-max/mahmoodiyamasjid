import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: AuthUser;
  loginAsRole: (role: UserRole, customChildId?: string) => void;
  logout: () => void;
  canAccessStudent: (studentId: string) => boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
}

const PUBLIC_USER: AuthUser = {
  uid: 'guest_visitor',
  email: '',
  displayName: 'Public Visitor',
  role: 'PUBLIC',
  linkedStudentIds: [],
};

const AuthContext = createContext<AuthContextType>({
  currentUser: PUBLIC_USER,
  loginAsRole: () => {},
  logout: () => {},
  canAccessStudent: () => false,
  isAdmin: false,
  isTeacher: false,
  isParent: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('masjid_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PUBLIC_USER;
      }
    }
    return PUBLIC_USER;
  });

  useEffect(() => {
    localStorage.setItem('masjid_user_session', JSON.stringify(currentUser));
  }, [currentUser]);

  const loginAsRole = (role: UserRole, customChildId: string = 'student_001') => {
    switch (role) {
      case 'PRIMARY_ADMIN':
        setCurrentUser({
          uid: 'admin_abdur_rahman',
          email: 'admin@masjidmehmoodiya.org',
          displayName: 'Abdur Rahman Khan (Primary Admin)',
          role: 'PRIMARY_ADMIN',
          linkedStudentIds: [],
        });
        break;
      case 'SECONDARY_ADMIN':
        setCurrentUser({
          uid: 'admin_trustee',
          email: 'trustee@masjidmehmoodiya.org',
          displayName: 'Masjid Admin Trustee',
          role: 'SECONDARY_ADMIN',
          linkedStudentIds: [],
        });
        break;
      case 'TEACHER':
        setCurrentUser({
          uid: 'teacher_ustadh',
          email: 'ustadh@masjidmehmoodiya.org',
          displayName: 'Ustadh Maktab',
          role: 'TEACHER',
          linkedStudentIds: [],
        });
        break;
      case 'PARENT':
        setCurrentUser({
          uid: 'parent_zubair_khan',
          email: 'parent@masjidmehmoodiya.org',
          displayName: 'Mohammed Zubair Khan (Parent)',
          role: 'PARENT',
          linkedStudentIds: [customChildId], // STRICT PER-CHILD PRIVACY
        });
        break;
      default:
        setCurrentUser(PUBLIC_USER);
        break;
    }
  };

  const logout = () => {
    setCurrentUser(PUBLIC_USER);
    localStorage.removeItem('masjid_user_session');
  };

  const canAccessStudent = (studentId: string): boolean => {
    if (currentUser.role === 'PRIMARY_ADMIN' || currentUser.role === 'SECONDARY_ADMIN' || currentUser.role === 'TEACHER') {
      return true;
    }
    if (currentUser.role === 'PARENT') {
      return currentUser.linkedStudentIds.includes(studentId);
    }
    return false;
  };

  const isAdmin = currentUser.role === 'PRIMARY_ADMIN' || currentUser.role === 'SECONDARY_ADMIN';
  const isTeacher = currentUser.role === 'TEACHER' || isAdmin;
  const isParent = currentUser.role === 'PARENT';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginAsRole,
        logout,
        canAccessStudent,
        isAdmin,
        isTeacher,
        isParent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
