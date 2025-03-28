
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Auth, 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, updateFirebaseConfig as updateFirebaseApp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (clearConfig?: boolean) => Promise<void>;
  updateFirebaseConfig: (config: FirebaseConfig) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateFirebaseConfig = async (config: FirebaseConfig) => {
    try {
      await updateFirebaseApp(config);
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating Firebase config:", error);
      toast({
        title: "خطأ في تحديث الإعدادات",
        description: "حدث خطأ أثناء تحديث إعدادات Firebase",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async (clearConfig: boolean = false) => {
    try {
      await firebaseSignOut(auth);
      
      if (clearConfig) {
        // Clear the Firebase config from localStorage
        localStorage.removeItem("firebaseConfig");
        toast({
          title: "تم مسح الإعدادات",
          description: "تم مسح إعدادات Firebase وتسجيل الخروج بنجاح",
        });
      } else {
        toast({
          title: "تم تسجيل الخروج بنجاح",
        });
      }
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
      toast({
        title: "خطأ في تسجيل الخروج",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    updateFirebaseConfig,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
