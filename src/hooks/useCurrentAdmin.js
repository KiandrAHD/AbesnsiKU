import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export function useCurrentAdmin() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setProfile(null);
        setLoading(false);
        setError("Sesi admin tidak ditemukan.");
        return;
      }

      try {
        setLoading(true);
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", user.email.toLowerCase()),
          limit(1)
        );
        const snapshot = await getDocs(userQuery);

        if (snapshot.empty) {
          setProfile(null);
          setError("Data admin tidak ditemukan di Firestore.");
          return;
        }

        const adminProfile = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        if (adminProfile.role !== "admin") {
          setProfile(null);
          setError("Akses ditolak. Akun ini bukan admin.");
          return;
        }

        setProfile(adminProfile);
        setError("");
      } catch (adminError) {
        console.error("[Firestore] Failed to load admin profile", adminError);
        setProfile(null);
        setError(adminError.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { profile, loading, error };
}
