import { db } from "@/app/firebase/clientApp";
import {
  doc,
  deleteDoc,
  setDoc as firebaseSetDoc,
  DocumentData,
  DocumentReference,
} from "firebase/firestore";

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(
      `Document with ID ${docId} deleted successfully from ${collectionName}`
    );
  } catch (error) {
    console.error("Error deleting document:", error);
  }
};
export const updateDocument = async (
  collectionName: string,
  id: string,
  updateGroup: Record<string, unknown> // 👈 c'est un objet, pas une string
) => {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, updateGroup, { merge: true }); // 👈 fusionne les champs
    console.log(`Document with ID ${id} updated successfully`);
  } catch (error) {
    console.error("Error updating document:", error);
  }
};
// This function is already provided by Firebase Firestore SDK as firebaseSetDoc.
// If you want to provide your own implementation (for mocking or testing), you could do:
async function setDoc(
  docRef: DocumentReference<DocumentData, DocumentData>,
  updateGroup: Record<string, unknown>,
  options: { merge: boolean }
) {
  // Call the Firebase SDK's setDoc function
  return firebaseSetDoc(docRef, updateGroup, options);
}
