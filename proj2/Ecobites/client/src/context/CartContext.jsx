/* eslint-disable no-unused-vars */
import { useContext, useState, useEffect } from 'react';
import { CartContext } from './contexts';
import { useAuthContext } from './AuthContext';

export const CartProvider = ({ children }) => {
  const { user } = useAuthContext();
  const storageKey = user ? `ecoCart_${user._id}` : 'ecoCart_guest';

  const readCartFromStorage = (key) => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Unable to read cart from storage', error);
      return [];
    }
  };

  const [cart, setCart] = useState(() => readCartFromStorage(storageKey));
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setCart(readCartFromStorage(storageKey));
  }, [storageKey]);

  // save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      console.warn('Unable to persist cart to storage', error);
    }
  }, [cart, storageKey]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (cartItem) => cartItem.name === item.name && cartItem.restaurant === item.restaurant
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + 1;
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  /** 
  const addOrderToCart = (order) => {
    order.items.forEach(item => {
      addToCart({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        restaurant: order.restaurantName || order.restaurant || "Unknown"
      })
    })
  } */

  const removeFromCart = (index) => {
    setCart((prev) => {
      const updated = [...prev];
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
      } else {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const increaseQuantity = (index) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      )
    );
  };

  const decreaseQuantity = (index) => {
    setCart((prev) => {
      const updated = [...prev];
      if (!updated[index]) return updated;
      if ((updated[index].quantity || 1) > 1) {
        updated[index].quantity -= 1;
        return updated;
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        addToCart,
        //addOrderToCart,
        removeFromCart,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        increaseQuantity,
        decreaseQuantity,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/** 
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
*/

// Note: raw CartContext is exported from `contexts.js`.
