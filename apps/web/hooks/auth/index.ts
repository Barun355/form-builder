import { trpc } from "~/trpc/client";

export const useSignup = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: createUserWithEmailAndPasswordAsync,
    mutate: createUserWithEmailAndPassword,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.createUserWithEmailAndPassword.useMutation({
    onSuccess: () => {
      utils.auth.getCurrentUserDetails.invalidate();
    },
  });

  return {
    createUserWithEmailAndPassword,
    createUserWithEmailAndPasswordAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  };
};

export const useLogin = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: loginUserWithEmailAndPasswordAsync,
    mutate: loginUserWithEmailAndPassword,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.loginUserWithEmailAndPassword.useMutation({
    onSuccess: () => {
      utils.auth.getCurrentUserDetails.invalidate();
    },
  });

  return {
    loginUserWithEmailAndPassword,
    loginUserWithEmailAndPasswordAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  };
};

export const useSignOut = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: signOutAsync,
    mutate: signOut,
    error,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.signOut.useMutation({
    onSettled: async () => {
      // Drop ALL cached queries — once the cookie is gone, no per-user data
      // (forms, analytics, dashboard) is valid anymore. Run on settle (not
      // just success) so an expired-cookie error path still cleans up.
      utils.invalidate();
    },
  });

  return { signOut, signOutAsync, error, isError, isIdle, isSuccess, status };
};

export const useUpdateProfile = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: updateProfileAsync,
    mutate: updateProfile,
    error,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.getCurrentUserDetails.invalidate();
    },
  });

  return {
    updateProfile,
    updateProfileAsync,
    error,
    isError,
    isIdle,
    isSuccess,
    status,
  };
};

export const useChangePassword = () => {
  const {
    mutateAsync: changePasswordAsync,
    mutate: changePassword,
    error,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.changePassword.useMutation();

  return {
    changePassword,
    changePasswordAsync,
    error,
    isError,
    isIdle,
    isSuccess,
    status,
  };
};

export const useUser = () => {
  const {
    data: userData,
    isLoading,
    error,
    isError,
    isFetching,
    isSuccess,
  } = trpc.auth.getCurrentUserDetails.useQuery();

  return {
    user: userData,
    isLoading,
    error,
    isError,
    isFetching,
    isSuccess,
  };
};
