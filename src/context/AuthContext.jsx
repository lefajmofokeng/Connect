import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "employers", firebaseUser.uid));
          setEmployerProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          console.error("Failed to load employer profile:", err);
          setEmployerProfile(null);
        }
      } else {
        setEmployerProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "employers", user.uid));
      setEmployerProfile(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, employerProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}