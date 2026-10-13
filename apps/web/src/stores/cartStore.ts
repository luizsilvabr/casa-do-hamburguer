import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, SelectedOption } from "../types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (cartItemId: string) => void;
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  clearCart: () => void;

  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  getItemPrice: (item: CartItem) => number;
  getSubtotal: () => number;
  getTotalQuantity: () => number;
}

function areOptionsEqual(a: SelectedOption[], b: SelectedOption[]): boolean {
  if (a.length !== b.length) return false;
  const idsA = a.map((opt) => opt.itemId).sort();
  const idsB = b.map((opt) => opt.itemId).sort();
  return idsA.every((id, index) => id === idsB[index]);
}

function isSameCartItem(
  candidate: Omit<CartItem, "id">,
  existing: CartItem,
): boolean {
  return (
    candidate.productId === existing.productId &&
    (candidate.observation ?? "") === (existing.observation ?? "") &&
    areOptionsEqual(candidate.selectedOptions, existing.selectedOptions)
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => isSameCartItem(item, i));

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }

          const newItem: CartItem = {
            ...item,
            id: crypto.randomUUID(),
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== cartItemId),
        }));
      },

      incrementItem: (cartItemId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        }));
      },

      decrementItem: (cartItemId) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getItemPrice: (item) => {
        const optionsTotal = item.selectedOptions.reduce(
          (sum, opt) => sum + opt.extraPrice,
          0,
        );
        return (item.basePrice + optionsTotal) * item.quantity;
      },

      getSubtotal: () => {
        const { items, getItemPrice } = get();
        return items.reduce((sum, item) => sum + getItemPrice(item), 0);
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "casa-do-hamburguer-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
