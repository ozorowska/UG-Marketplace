"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaUser, FaPen, FaTrash, FaSignOutAlt } from "react-icons/fa";

import SidebarLayout from "../../components/SidebarLayout";
import TopNavbar from "../../components/TopNavbar";

interface CustomUser {
  name: string | null;
  email: string;
  image?: string;
  major?: string;
}

interface CustomSession {
  user: CustomUser;
}

// Typ danych kierunku – zakładamy, że plik JSON ma pole "kierunek"
interface UgMajor {
  kierunek: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Stany profilu
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [ugMajors, setUgMajors] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Pozostałe stany (dla zmiany hasła, komunikatów, ładowania, itd.)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pobieranie danych profilu i ustawianie imienia, kierunku oraz zdjęcia
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    const { user } = session as CustomSession;
    setName(user.name || "");
    if (user.major) {
      setMajor(user.major);
    }

    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user.major) setMajor(data.user.major);
        if (data.user.image) setImagePreview(data.user.image);
      })
      .catch(console.error);
  }, [session, status, router]);

  // Pobieranie listy kierunków z pliku JSON (bez filtrowania po wydziale)
  useEffect(() => {
    fetch("/ug_majors.json")
      .then((res) => res.json())
      .then((data: UgMajor[]) => {
        const majorsList = Array.from(new Set(data.map((item) => item.kierunek)));
        setUgMajors(majorsList);
      })
      .catch(console.error);
  }, []);

  // Aktualizacja imienia
  const handleNameChange = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (!res.ok) {
        throw new Error((await res.json()).error || "Error updating name");
      }
      
      // Update the session
      await update({
        ...session,
        user: { ...(session as CustomSession).user, name },
      });
      
      // Force a UI refresh by updating the local state and session data
      const customSession = session as CustomSession;
      customSession.user.name = name;
      
      // Set success message and exit edit mode
      setSuccess("Name updated successfully!");
      setIsEditingName(false);
      
      // Force a router refresh
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Aktualizacja kierunku
 // Aktualizacja kierunku
const handleMajorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selected = e.target.value;
  setMajor(selected);
  if (!selected) return;
  setIsLoading(true);
  setError("");
  setSuccess("");
  try {
    const res = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ major: selected }),
    });
    if (!res.ok) {
      throw new Error((await res.json()).error || "Error updating major");
    }
    await update({
      ...session,
      user: { ...(session as CustomSession).user, major: selected },
    });
    setSuccess("Major updated successfully!");
    // Odświeżenie strony (wywołanie router.refresh())
    router.refresh();
    setTimeout(() => setSuccess(""), 3000);
  } catch (e: any) {
    setError(e.message);
  } finally {
    setIsLoading(false);
  }
};


  // Obsługa zmiany zdjęcia profilowego
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("image", profileImage);
      const res = await fetch("/api/user/profile/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Error uploading image");
      }
      const data = await res.json();
      await update({
        ...session,
        user: { ...(session as CustomSession).user, image: data.imageUrl },
      });
      setSuccess("Profile image updated!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Zmiana hasła
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Error changing password");
      }
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Usuwanie konta
  const deleteAccount = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Error deleting account");
      }
      await signOut({ redirect: false });
      router.push("/login?deleted=true");
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  // Wylogowanie
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <>
        <TopNavbar />
        <SidebarLayout>
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </SidebarLayout>
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <TopNavbar />
      <SidebarLayout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded mb-6">
              {success}
            </div>
          )}
          {/* Profile Image & Details */}
          <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row mb-8">
            <div className="md:w-1/3 flex flex-col items-center border-b md:border-b-0 md:border-r p-4">
              <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-200 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-gray-400">
                    <FaUser size={64} />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={isLoading}
                >
                  Choose Image
                </button>
                {profileImage && (
                  <button
                    onClick={uploadProfileImage}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    disabled={isLoading}
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
            <div className="md:w-2/3 p-4">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded border">
                  {(session as CustomSession).user.email}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Name
                </label>
                {!isEditingName ? (
  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
    <span>{name || "Not set"}</span>
    <button onClick={() => setIsEditingName(true)} className="text-blue-600">
      <FaPen size={16} />
    </button>
  </div>
) : (
  <div className="flex gap-2">
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="flex-1 p-3 border rounded"
      placeholder="Your name"
    />
    <button
      onClick={handleNameChange}
      className="px-4 py-2 bg-green-600 text-white rounded"
      disabled={isLoading}
    >
      Save
    </button>
    <button
      onClick={() => {
        setIsEditingName(false);
        setName((session as CustomSession).user.name || "");
      }}
      className="px-4 py-2 bg-gray-500 text-white rounded"
      disabled={isLoading}
    >
      Cancel
    </button>
  </div>
)}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Major
                </label>
                <select
                  value={major}
                  onChange={handleMajorChange}
                  className="w-full p-3 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select major</option>
                  {ugMajors.map((mjr) => (
                    <option key={mjr} value={mjr}>
                      {mjr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded shadow p-6 mb-8">
            <h2 className="text-xl mb-4">Change Password</h2>
            {isChangingPassword ? (
              <div className="space-y-4">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="Confirm new password"
                />
                <div className="flex gap-2">
                  <button
                    onClick={changePassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    disabled={isLoading}
                  >
                    Change
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={isLoading}
              >
                Change Password
              </button>
            )}
          </div>

          {/* Account Actions */}
<div className="bg-white rounded shadow p-6 mb-8">
  <h2 className="text-xl mb-4">Account Actions</h2>
  <div className="flex flex-col gap-4">
    <button
      onClick={handleLogout}
      className="px-6 py-3 bg-gray-200 text-gray-800 rounded"
      disabled={isLoading}
    >
      <FaSignOutAlt size={16} /> Logout
    </button>
    {isDeleting ? (
      <div className="flex flex-col gap-2">
        <div className="text-red-700 font-bold">
          Czy jesteś pewien? WSZYSTKO ZOSTANIE USUNIĘTE!!!!
        </div>
        <div className="flex gap-2">
          <button
            onClick={deleteAccount}
            className="px-6 py-3 bg-red-600 text-white rounded"
            disabled={isLoading}
          >
            Confirm Delete
          </button>
          <button
            onClick={() => setIsDeleting(false)}
            className="px-6 py-3 bg-gray-500 text-white rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setIsDeleting(true)}
        className="px-6 py-3 bg-red-100 text-red-700 rounded"
        disabled={isLoading}
      >
        <FaTrash size={16} /> Delete Account
      </button>
    )}
  </div>
</div>

        </div>
      </SidebarLayout>
    </>
  );
}
