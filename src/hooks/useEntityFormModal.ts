"use client";

import { useCallback, useState } from "react";
import { useModalState } from "./useModalState";

interface UseEntityFormModalOptions<C, U> {
  create: (data: C) => Promise<unknown>;
  update: (id: string, data: U) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

/**
 * Shared create/edit/delete modal state for entity list pages.
 * Encapsulates the form sheet open state, the item being edited/deleted,
 * and the submit/delete handlers (toasts are handled by the API layer).
 */
export function useEntityFormModal<T extends { id: string }, C, U>({
  create,
  update,
  remove,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: UseEntityFormModalOptions<C, U>) {
  const { isOpen, open, close } = useModalState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    open();
  }, [open]);

  const openEdit = useCallback(
    (item: T) => {
      setEditing(item);
      open();
    },
    [open],
  );

  const closeForm = useCallback(() => {
    close();
    setEditing(null);
  }, [close]);

  const handleSubmit = useCallback(
    async (data: C | U) => {
      try {
        if (editing) {
          await update(editing.id, data as U);
        } else {
          await create(data as C);
        }
        closeForm();
      } catch {
        // toast handled by useEntityApi
      }
    },
    [editing, create, update, closeForm],
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch {
      // toast handled by useEntityApi
    }
  }, [deleting, remove]);

  return {
    formOpen: isOpen,
    closeForm,
    editing,
    deleting,
    setDeleting,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    isSubmitting: isCreating || isUpdating,
    isDeleting,
  };
}
