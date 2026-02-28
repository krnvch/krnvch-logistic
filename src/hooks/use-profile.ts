import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

interface ProfileData {
  firstName: string;
  lastName: string;
  role: UserRole;
}

export function useProfile() {
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const updateProfile = async (data: ProfileData) => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
        },
      });
      if (error) throw error;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (
    email: string,
    currentPassword: string,
    newPassword: string
  ) => {
    setChangingPassword(true);
    try {
      // Verify current password by signing in
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
      if (signInError) {
        throw new Error("Неверный текущий пароль");
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } finally {
      setChangingPassword(false);
    }
  };

  return { updateProfile, changePassword, saving, changingPassword };
}
