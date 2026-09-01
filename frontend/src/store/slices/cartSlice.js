import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'medifind_cart';

const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
  }
  return {
    pharmacy: null,
    items: [],
    deliveryMethod: 'HOME_DELIVERY',
  };
};

const saveCartToStorage = (state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pharmacy: state.pharmacy,
        items: state.items,
        deliveryMethod: state.deliveryMethod,
      })
    );
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { medicine, pharmacy, quantity = 1, price, maxStock = 99 } = action.payload;

      // If cart has items from another pharmacy, reset cart to new pharmacy
      if (state.pharmacy && state.pharmacy.id !== pharmacy.id) {
        state.items = [];
      }
      state.pharmacy = pharmacy;

      const existingIndex = state.items.findIndex((item) => item.medicineId === medicine.id);
      if (existingIndex >= 0) {
        const newQty = state.items[existingIndex].quantity + quantity;
        state.items[existingIndex].quantity = Math.min(newQty, state.items[existingIndex].maxStock || 99);
        state.items[existingIndex].price = price || state.items[existingIndex].price;
      } else {
        state.items.push({
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
          requiresPrescription: medicine.requiresPrescription || false,
          price: Number(price) || 0,
          quantity: Math.min(quantity, maxStock),
          maxStock: maxStock || 99,
        });
      }
      saveCartToStorage(state);
    },

    updateQuantity: (state, action) => {
      const { medicineId, quantity } = action.payload;
      const item = state.items.find((i) => i.medicineId === medicineId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.medicineId !== medicineId);
        } else {
          item.quantity = Math.min(quantity, item.maxStock || 99);
        }
      }
      if (state.items.length === 0) {
        state.pharmacy = null;
      }
      saveCartToStorage(state);
    },

    removeFromCart: (state, action) => {
      const medicineId = action.payload;
      state.items = state.items.filter((i) => i.medicineId !== medicineId);
      if (state.items.length === 0) {
        state.pharmacy = null;
      }
      saveCartToStorage(state);
    },

    setDeliveryMethod: (state, action) => {
      state.deliveryMethod = action.payload;
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.pharmacy = null;
      state.items = [];
      state.deliveryMethod = 'HOME_DELIVERY';
      saveCartToStorage(state);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, setDeliveryMethod, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartPharmacy = (state) => state.cart.pharmacy;
export const selectDeliveryMethod = (state) => state.cart.deliveryMethod;

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

export const selectDeliveryFee = (state) =>
  state.cart.deliveryMethod === 'HOME_DELIVERY' && state.cart.items.length > 0 ? 40 : 0;

export const selectCartTotal = (state) => {
  const subtotal = selectCartSubtotal(state);
  const deliveryFee = selectDeliveryFee(state);
  return subtotal + deliveryFee;
};

export default cartSlice.reducer;
