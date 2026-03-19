import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Toggle save — works for both logged in and guest users
export async function toggleSavedJob(jobId, user) {
  // Always update localStorage
  const local = JSON.parse(localStorage.getItem("savedJobs") || "[]");
  const isSaved = local.includes(jobId);
  const updated = isSaved ? local.filter(id => id !== jobId) : [...local, jobId];
  localStorage.setItem("savedJobs", JSON.stringify(updated));

  // If logged in job seeker, also sync to Firestore
  if (user) {
    try {
      const jsSnap = await getDoc(doc(db, "jobseekers", user.uid));
      if (jsSnap.exists()) {
        await updateDoc(doc(db, "jobseekers", user.uid), {
          savedJobs: isSaved ? arrayRemove(jobId) : arrayUnion(jobId),
        });
      }
    } catch (err) {
      console.error("Failed to sync saved job:", err);
    }
  }

  return !isSaved;
}

export function getLocalSavedJobs() {
  try { return JSON.parse(localStorage.getItem("savedJobs") || "[]"); }
  catch { return []; }
}