import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, profile, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile, deleteAccount } = useAuthStore()
  return { user, profile, loading, signIn, signUp, signInWithGoogle, signOut, updateProfile, deleteAccount }
}
