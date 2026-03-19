import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const JobSeekerAuthContext = createContext(null);

export function JobSeekerAuthProvider({ children }) {
  const [jobSeeker, setJobSeeker] = useState(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setJobSeeker(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "jobseekers", firebaseUser.uid));
          setJobSeekerProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          console.error("Failed to load job seeker profile:", err);
          setJobSeekerProfile(null);
        }
      } else {
        setJobSeekerProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshJobSeekerProfile = async () => {
    if (!jobSeeker) return;
    try {
      const snap = await getDoc(doc(db, "jobseekers", jobSeeker.uid));
      setJobSeekerProfile(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <JobSeekerAuthContext.Provider value={{ jobSeeker, jobSeekerProfile, loading, refreshJobSeekerProfile }}>
      {children}
    </JobSeekerAuthContext.Provider>
  );
}

export function useJobSeekerAuth() {
  return useContext(JobSeekerAuthContext);
}