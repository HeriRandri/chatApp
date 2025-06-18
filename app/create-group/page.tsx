"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/clientApp";
import LoadingSpinner from "@/components/loadingSpinner";
import CreateGroupForm from "@/components/createForm";

export default function CreateGroupPage() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <LoadingSpinner />;
  if (!user) return <div>Veuillez vous connecter</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <CreateGroupForm />
    </div>
  );
}
