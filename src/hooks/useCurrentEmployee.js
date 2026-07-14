import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export function useCurrentEmployee() {
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user?.email) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        const employeeQuery = query(
          usersRef,
          where("email", "==", user.email.trim().toLowerCase()),
          limit(1)
        );
        const snapshot = await getDocs(employeeQuery);

        if (snapshot.empty) {
          setProfile(null);
          setError("Data karyawan tidak ditemukan.");
        } else {
          const docSnapshot = snapshot.docs[0];
          setProfile({ id: docSnapshot.id, ...docSnapshot.data() });
          setError("");
        }
      } catch (profileError) {
        console.error("[Firestore] Failed to load employee profile", profileError);
        setProfile(null);
        setError(profileError.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { authUser, profile, loading, error };
}
