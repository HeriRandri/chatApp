// services/friendService.ts
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../app/firebase/clientApp";

interface FriendRequest {
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
}

export const sendFriendRequest = async (
  fromUid: string,
  toUid: string
): Promise<void> => {
  const friendRequestRef = collection(db, "friendRequests");

  // Check if request already exists
  const existingQuery = query(
    friendRequestRef,
    where("from", "==", fromUid),
    where("to", "==", toUid)
  );
  const existingSnapshot = await getDocs(existingQuery);
  if (!existingSnapshot.empty) return;

  await addDoc(friendRequestRef, {
    from: fromUid,
    to: toUid,
    status: "pending",
  } as FriendRequest);
};

interface ReceivedFriendRequest extends FriendRequest {
  id: string;
}

export const getReceivedRequests = async (
  userUid: string
): Promise<ReceivedFriendRequest[]> => {
  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", userUid),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as FriendRequest),
  }));
};

export const acceptFriendRequest = async (
  requestId: string,
  fromUid: string,
  toUid: string
): Promise<void> => {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, { status: "accepted" });

  const friendsRef = collection(db, "friends");
  await addDoc(friendsRef, {
    users: [fromUid, toUid],
  });
};

interface RejectFriendRequestParams {
  requestId: string;
}

export const rejectFriendRequest = async ({
  requestId,
}: RejectFriendRequestParams): Promise<void> => {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, { status: "rejected" });
};

interface Friend {
  users: [string, string];
}

export const getFriendsList = async (userUid: string): Promise<string[]> => {
  const q = query(
    collection(db, "friends"),
    where("users", "array-contains", userUid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      (doc.data() as Friend).users.find((uid: string) => uid !== userUid)!
  );
};
