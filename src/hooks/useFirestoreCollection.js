import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

function normalizeValue(value) {
  if (value?.toDate) {
    return value.toDate();
  }

  return value;
}

function normalizeDocument(docSnapshot) {
  const data = docSnapshot.data();

  return Object.entries(data).reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: normalizeValue(value),
    }),
    { id: docSnapshot.id }
  );
}

export function useFirestoreCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        setData(snapshot.docs.map(normalizeDocument));
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error(`[Firestore] Failed to load collection "${collectionName}"`, snapshotError);
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error };
}
