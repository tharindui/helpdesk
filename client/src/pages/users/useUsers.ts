import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type User, usersApi } from "./usersApi";

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const addMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) => [...prev, user]);
    },
  });

  const editMutation = useMutation({
    mutationFn: usersApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: (_, id) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) =>
        prev.filter((u) => u.id !== id)
      );
    },
  });

  return { query, addMutation, editMutation, deleteMutation };
}
