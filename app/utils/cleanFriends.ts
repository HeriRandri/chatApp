// utils/cleanFriends.ts
import { getDocs, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/clientApp";

// 🔁 Fonction pour enlever les doublons par uid
interface Friend {
  uid: string;
  [key: string]: unknown;
}

export function removeDuplicateFriends(friendList: Friend[]): Friend[] {
  const seen = new Map();
  for (const entry of friendList) {
    if (!seen.has(entry.uid)) {
      seen.set(entry.uid, entry);
    }
  }
  return Array.from(seen.values());
}

// 🧹 Fonction pour nettoyer tous les documents "friends"
export async function cleanAllFriendLists() {
  const friendsCollection = await getDocs(collection(db, "friends"));
  for (const userDoc of friendsCollection.docs) {
    const data = userDoc.data();
    if (!data.list || !Array.isArray(data.list)) continue;

    const cleanedList = removeDuplicateFriends(data.list);

    if (cleanedList.length !== data.list.length) {
      await updateDoc(doc(db, "friends", userDoc.id), {
        list: cleanedList,
      });
      console.log(`Nettoyé: ${userDoc.id}`);
    }
  }
}
