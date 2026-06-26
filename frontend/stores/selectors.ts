import { useItemStore } from './itemStore';
import { useTodoStore } from './todoStore';
import { useCategoryStore } from './categoryStore';
import { useLocationStore } from './locationStore';
import { useAuthStore } from './authStore';
import { useProfileStore } from './profileStore';
import type { LifeItem, LifeTodo, LifeCategory, LifeLocation } from '../types';

// ---- itemStore selectors ----

export const useItems = () => useItemStore((s) => s.items);
export const useItemsLoading = () => useItemStore((s) => s.loading);
export const useItemsError = () => useItemStore((s) => s.error);
export const useItemsActions = () =>
  useItemStore((s) => ({
    fetchItems: s.fetchItems,
    addItem: s.addItem,
    updateItem: s.updateItem,
    deleteItem: s.deleteItem,
    clearError: s.clearError,
  }));

// ---- todoStore selectors ----

export const useTodos = () => useTodoStore((s) => s.todos);
export const useTodosLoading = () => useTodoStore((s) => s.loading);
export const useTodosError = () => useTodoStore((s) => s.error);
export const useTodosActions = () =>
  useTodoStore((s) => ({
    fetchTodos: s.fetchTodos,
    addTodo: s.addTodo,
    updateTodo: s.updateTodo,
    deleteTodo: s.deleteTodo,
    toggleComplete: s.toggleComplete,
    reorderTodos: s.reorderTodos,
    clearError: s.clearError,
  }));

// ---- categoryStore selectors ----

export const useCategories = () => useCategoryStore((s) => s.categories);
export const useCategoryLoading = () => useCategoryStore((s) => s.loading);
export const useCategoryError = () => useCategoryStore((s) => s.error);
export const useCategoryActions = () =>
  useCategoryStore((s) => ({
    fetchCategories: s.fetchCategories,
    addCategory: s.addCategory,
    updateCategory: s.updateCategory,
    deleteCategory: s.deleteCategory,
    clearError: s.clearError,
  }));

// ---- locationStore selectors ----

export const useLocations = () => useLocationStore((s) => s.locations);
export const useLocationLoading = () => useLocationStore((s) => s.loading);
export const useLocationError = () => useLocationStore((s) => s.error);
export const useLocationActions = () =>
  useLocationStore((s) => ({
    fetchLocations: s.fetchLocations,
    addLocation: s.addLocation,
    updateLocation: s.updateLocation,
    deleteLocation: s.deleteLocation,
    clearError: s.clearError,
  }));

// ---- authStore selectors ----

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.loading);

// ---- profileStore selectors ----

export const useProfile = () => useProfileStore((s) => s.profile);
export const useProfileLoading = () => useProfileStore((s) => s.loading);
export const useProfileError = () => useProfileStore((s) => s.error);
export const useCachedAvatar = () => useProfileStore((s) => s.cachedAvatarUrl);
