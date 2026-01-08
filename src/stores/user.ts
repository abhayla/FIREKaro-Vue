import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
}

export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<User | null>(null);
  const familyMembers = ref<FamilyMember[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() => user.value?.name ?? "User");
  const userInitials = computed(() => {
    if (!user.value?.name) return "U";
    return user.value.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });

  // Actions
  async function fetchSession() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user) {
        user.value = session.user;
      } else {
        user.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch session";
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchFamilyMembers() {
    if (!user.value) return;
    try {
      const res = await fetch("/api/family-members");
      if (res.ok) {
        familyMembers.value = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch family members:", e);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      user.value = null;
      familyMembers.value = [];
    } catch (e) {
      console.error("Failed to sign out:", e);
    }
  }

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  return {
    // State
    user,
    familyMembers,
    isLoading,
    error,
    // Computed
    isAuthenticated,
    userName,
    userInitials,
    // Actions
    fetchSession,
    fetchFamilyMembers,
    signOut,
    setUser,
  };
});
