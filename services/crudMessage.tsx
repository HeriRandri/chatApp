import { doc as firestoreDoc, deleteDoc, Firestore } from "@firebase/firestore";
import { db } from "../app/firebase/clientApp";

function doc(db: Firestore, collectionName: string, docId: string) {
  return firestoreDoc(db, collectionName, docId);
}

export const deleteMessage = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log(
      `Message with ID ${docId} deleted successfully from ${collectionName}`
    );
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};
