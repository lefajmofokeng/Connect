import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'employer' | 'jobseeker' | 'admin' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Admin check first
        if (firebaseUser.email === "lefamjack@gmail.com") {
          setUserRole("admin");
          setEmployerProfile(null);
          setJobSeekerProfile(null);
          setLoading(false);
          return;
        }

        try {
          // Check employer first
          const empSnap = await getDoc(doc(db, "employers", firebaseUser.uid));
          if (empSnap.exists()) {
            setEmployerProfile(empSnap.data());
            setJobSeekerProfile(null);
            setUserRole("employer");
            setLoading(false);
            return;
          }

          // Check job seeker
          const jsSnap = await getDoc(doc(db, "jobseekers", firebaseUser.uid));
          if (jsSnap.exists()) {
            setJobSeekerProfile(jsSnap.data());
            setEmployerProfile(null);
            setUserRole("jobseeker");
            setLoading(false);
            return;
          }

          // New user — no profile yet
          setUserRole(null);
          setEmployerProfile(null);
          setJobSeekerProfile(null);
        } catch (err) {
          console.error("Failed to load profile:", err);
          setEmployerProfile(null);
          setJobSeekerProfile(null);
          setUserRole(null);
        }
      } else {
        setEmployerProfile(null);
        setJobSeekerProfile(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      if (userRole === "employer") {
        const snap = await getDoc(doc(db, "employers", user.uid));
        setEmployerProfile(snap.exists() ? snap.data() : null);
      } else if (userRole === "jobseeker") {
        const snap = await getDoc(doc(db, "jobseekers", user.uid));
        setJobSeekerProfile(snap.exists() ? snap.data() : null);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      employerProfile,
      jobSeekerProfile,
      userRole,
      loading,
      refreshProfile,
      // Keep backward compat alias
      refreshJobSeekerProfile: refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
