/* eslint-disable no-unused-vars */
import { useContext, useState, useEffect } from 'react';
import { CartContext } from './contexts';
import { useAuth } from '../hooks/useAuth';

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const storageKey = currentUser ? `ecoCart_${currentUser._id}` : 'ecoCart_guest';
  const [cart, setCart] = useState(() => {
    // load initial cart from localStorage
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    console.log(cart)
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
