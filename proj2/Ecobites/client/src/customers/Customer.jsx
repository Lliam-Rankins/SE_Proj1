/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantService } from '../api/services/restaurant.service.js';
import { menuService } from '../api/services/menu.service.js';
import { useRestaurantContext } from '../context/RestaurantContext';
import RestaurantReviews from '../restaurants/RestaurantReviews.jsx';
import { reviewService } from '../api/services/review.service.js';
import { userService } from '../api/services/user.service.js';
import { useAuthContext } from '../context/AuthContext.jsx';
import { authService } from '../api/services/auth.service.js';
import { toast } from 'react-toastify';
import { useCart } from '../context/useCart';


const Customer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState(0);
  const { user: authUser } = useAuthContext();

  // Fetch restaurants from API
  const [restaurants, setRestaurants] = useState([]);
  const { selectedRestaurant, setSelectedRestaurant, menu, fetchMenu } = useRestaurantContext();
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantService.getAll();
        if (response.success && response.data) {
          // Transform the data to match our component's needs
          const transformedData = response.data.map(restaurant => {
            const cuisineArray = Array.isArray(restaurant.cuisine)
              ? restaurant.cuisine
              : (restaurant.cuisine ? [restaurant.cuisine] : []);
            const addr = restaurant.address || {};

            return {
              id: restaurant._id,
              name: restaurant.restaurantName || restaurant.name || 'Restaurant',
              ownerName: restaurant.name || '',
              email: restaurant.email || '',
              phone: restaurant.phone || '',
              cuisine: cuisineArray.join(', '), // Join array into string for compatibility
              address: addr.street && addr.city && addr.zipCode
                ? `${addr.street}, ${addr.city}, ${addr.zipCode}`
                : 'Address unavailable',
              isAvailable: (restaurant.isAvailable ?? true),
              // Add default values for missing fields
              rating: restaurant.averageRating ?? 0,
              totalReviews: restaurant.totalReviews,
              ratingDistribution: restaurant.ratingDistribution,
              deliveryTime: '30-45', // Default delivery time
              image: '🍽️', // Default image
              description: `${restaurant.restaurantName || restaurant.name || 'Restaurant'} - ${cuisineArray.join(' & ')} cuisine`,
              menuItems: [] // We'll need to fetch menu items separately
            };
          });
          setRestaurants(transformedData);
        } else {
          throw new Error('Invalid response format');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch restaurants: ' + err.message);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Effect to fetch menu items when a restaurant is selected
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (selectedRestaurant) {
        try {
          const response = await menuService.getByRestaurant(selectedRestaurant.id);
          if (response) {
              const menuItems = response;
              console.log('Fetched menu items:', menuItems);
              // Update selected restaurant with menu items (preserve id/_id so frontend can send menuItemId)
              setSelectedRestaurant(prev => ({
                ...(prev || {}),
                menuItems: menuItems.map(item => ({
                  _id: item._id || item.id,
                  id: item._id || item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  isAvailable: item.isAvailable,
                  isSeasonal: item.isSeasonal || false,
                  seasonalRewardPoints: item.seasonalRewardPoints || 0,
                  packagingOptions: item.packagingOptions || []
                }))
              }));
          }
        } catch (err) {
          console.error('Failed to fetch menu items:', err);
        }
      }
    };

    fetchMenuItems();
  }, [selectedRestaurant?.id, setSelectedRestaurant]);

  const [query, setQuery] = useState('');
  const [showSeasonalNudge, setShowSeasonalNudge] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('showSeasonalNudge') === '1') {
        setShowSeasonalNudge(true);
        sessionStorage.removeItem('showSeasonalNudge');
      }
    } catch (error) {
      console.error('Failed to access session storage:', error);
    }
  }, []);
  const [cuisineFilter, setCuisineFilter] = useState('All');

  const {
    cart,
    isCartOpen,
    addToCart,
    toggleCart,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    getCartTotal,
  } = useCart();

  const cuisines = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (typeof r.cuisine === 'string') {
        r.cuisine.split(',').forEach((c) => set.add(c.trim()));
      }
    });
    return ['All', ...Array.from(set)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const q = query.toLowerCase();
    return restaurants.filter((r) => {
      const matchesQuery =
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        (r.menuItems && r.menuItems.some((mi) => mi.name.toLowerCase().includes(q) || mi.description.toLowerCase().includes(q)));
      const matchesCuisine = cuisineFilter === 'All' || r.cuisine.includes(cuisineFilter);
      return matchesQuery && matchesCuisine && r.isAvailable;
    });
  }, [restaurants, query, cuisineFilter]);

  const formatCurrency = (num) => {
    return Number(num).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };

  const handleCheckout = () => {
    navigate('/customer/checkout');
    closeCart();
  };

  // fetch user profile
  useEffect(() => {
    if (!authUser?._id) return;

      const fetchUser = async () => {
        try {
          const user = await authService.fetchMe();
          setPoints(user.rewardPoints ?? 0);
          
        } catch (error){
          console.error("Failed to fetch user points:", error);
        }
      };
      fetchUser();
  }, [authUser]);

  useEffect(() => {
  if (points >= 100) {
    toast.success("🎉 You earned a $5 reward! Great job collecting eco-points!", {
      toastId: "reward-earned"
    });
  }
}, [points]);

  const percent = points; // 20 / 100 * 100 = 20%
  const pointsToReward = 100 - points; // 100 - 20 = 80


  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      {/* Hero */}
      <header className="max-w-6xl mx-auto mb-8">
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700">
            {error}
          </div>
        )}
        {showSeasonalNudge && (
          <div className="mb-3 p-3 rounded-lg bg-orange-50 text-orange-800 flex items-center justify-between">
            <div className="text-sm">
              Seasonal Highlights are live! Choose seasonal items to earn extra eco rewards on delivery.
            </div>
            <button onClick={() => setShowSeasonalNudge(false)} className="text-orange-700 text-sm font-semibold">Dismiss</button>
          </div>
        )}
  <div className="bg-linear-to-r from-emerald-600 to-emerald-400 text-white rounded-xl p-8 shadow-md flex flex-col md:flex-row items-start md:items-center gap-6">
         
         
         <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-extrabold">Discover local eco-friendly restaurants</h1>
          <p className="mt-2 text-emerald-100">Fresh, sustainable meals delivered fast — curated for you.</p>
          
          <div className="mt-4 flex gap-2 items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants or dishes..."
              className="px-4 py-2 rounded-lg text-gray-800 flex-1 md:flex-none md:w-96"
            />
            <button 
              onClick={() => { setQuery(''); setCuisineFilter('All'); }} 
              className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-semibold whitespace-nowrap"
            >
              Clear
            </button>
            
            {/* Points Meter */}
            <div className="hidden md:flex flex-col ml-4 flex-1 max-w-xs">
              <div className="w-full bg-white/20 rounded-full h-5 overflow-hidden shadow-inner relative">
                <div 
                  className="h-5 bg-gradient-to-r from-white via-yellow-200 to-yellow-300 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${percent}%` }}
                >
                  {/* Animated shine effect - sliding shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer"></div>
                  {/* Pulsing glow overlay */}
                  <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                  {/* Progress percentage */}
                  {percent > 0 && (
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-emerald-700 drop-shadow">
                      {percent}%
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs mt-1.5 text-emerald-50 font-medium flex items-center gap-1">
                <span className="text-yellow-300 animate-pulse">✨</span>
                {pointsToReward} points until your $5 reward!
              </p>
            </div>

              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .shimmer {
                  animation: shimmer 2s infinite;
                }
              `}</style>
          </div>

          {/* Mobile progress meter - shown below search on small screens */}
          <div className="md:hidden mt-4">
            <div className="w-full bg-white/20 rounded-full h-5 overflow-hidden shadow-inner relative">
              <div 
                className="h-5 bg-gradient-to-r from-white via-yellow-200 to-yellow-300 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${percent}%` }}
              >
              {/* Animated shine effect - sliding shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer"></div>
                  {/* Pulsing glow overlay */}
                  <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                  {/* Progress percentage */}
                  {percent > 0 && (
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-emerald-700 drop-shadow">
                      {percent}%
                    </span>
                  )}
              </div>
            </div>
            <p className="text-xs mt-1.5 text-emerald-50 font-medium flex items-center gap-1">
              <span className="text-yellow-300 animate-pulse">✨</span>
              {pointsToReward} points until your $5 reward!
            </p>
          </div>
          
              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .shimmer {
                  animation: shimmer 2s infinite;
                }
              `}</style>
        </div>

        <div className="ml-auto text-right">
          <div className="text-sm">Cart & Orders</div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => navigate('/customer/orders')}
              className="cursor-pointer bg-white text-emerald-600 px-3 py-2 rounded-full font-semibold shadow-md hover:bg-emerald-50 transition-colors"
              title="View Order Status"
            >
              📋
            </button> 

            {/* Cancelled Orders */} 
            <button
              onClick={() => navigate('/customer/cancelled-orders')}
              className="cursor-pointer bg-white text-emerald-600 px-3 py-2 rounded-full font-semibold shadow-md hover:bg-emerald-50 transition-colors"
              title="View Cancelled Orders"
            >
              ❌
            </button> 

            {/* My Bids */} 
            <button
              onClick={() => navigate('/customer/my-bids')}
              className="cursor-pointer bg-white text-emerald-600 px-3 py-2 rounded-full font-semibold shadow-md hover:bg-emerald-50 transition-colors"
              title="View My Bids"
            >
              💰
            </button>

            <button
              onClick={toggleCart}
              className="cursor-pointer bg-white text-emerald-600 px-4 py-2 rounded-full font-semibold shadow-md flex items-center gap-3 hover:bg-emerald-50 transition-colors"
            >
              <span className="text-lg">🛒</span>
              <span>{cart.reduce((s, i) => s + (i.quantity || 1), 0)}</span>
              <span className="text-sm font-medium">{cart.length > 0 ? formatCurrency(getCartTotal()) : ''}</span>
            </button>
          </div> 

          {/* Ongoing Order Indicator */}
          <div className="mt-2 text-xs text-emerald-200">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Order in progress
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {cuisines.map((c) => (
          <button
            key={c}
            onClick={() => setCuisineFilter(c)}
            className={`px-3 py-1 rounded-full text-sm ${cuisineFilter === c ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 shadow-sm'}`}
          >
            {c}
          </button>
        ))}
      </div>
    </header>

  {/* Main content */}
  <main className="max-w-6xl mx-auto grid grid-cols-1 gap-6">
  {/* Restaurants grid / Menu view */}
  <section>
          {selectedRestaurant ? (
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                  <p className="text-sm text-gray-500">{selectedRestaurant.cuisine} • {selectedRestaurant.deliveryTime} mins</p>
                  <div className="text-yellow-500 font-bold">⭐ {selectedRestaurant.rating?.toFixed(1) || 0}</div>
                  <div className="text-gray-500 text-sm">{selectedRestaurant.totalReviews} reviews</div> 
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedRestaurant(null);
                      // Clear the menu when going back
                      fetchMenu(null);
                    }} 
                    className="px-3 py-1 rounded-md bg-gray-100"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedRestaurant.menuItems.map((item, i) => (
                  <div key={i} className="border rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="text-emerald-600 font-bold">{formatCurrency(item.price)}</div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      <div className="text-xs text-gray-400 mt-2">Category: {item.category}</div>
                      {item.isSeasonal && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700">Seasonal Highlight</span>
                          {item.seasonalRewardPoints > 0 && (
                            <span className="text-[10px] text-orange-700">Earn +{item.seasonalRewardPoints} pts</span>
                          )}
                        </div>
                      )}
                      {item.packagingOptions && item.packagingOptions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.packagingOptions.map((opt, idx) => (
                            <span key={idx} className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 capitalize">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => addToCart({ 
                          ...item, 
                          restaurant: selectedRestaurant.name,
                          restaurantId: selectedRestaurant.id,
                          menuItemId: item._id // Make sure this is also included
                        })} 
                        className="ml-auto px-3 py-2 bg-emerald-600 text-white rounded-md"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            filteredRestaurants.length === 0 ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">No restaurants match your search.</div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredRestaurants.map((r) => (
                  <article key={r.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">{r.image}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-lg font-semibold">{r.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-500 font-bold">⭐ {r.rating?.toFixed(1) || 0}</div>
                            <div className="text-gray-500 text-sm">{r.totalReviews} reviews</div> 
                            <div className="text-sm text-gray-400">{r.deliveryTime} mins</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 items-center">
                          <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">{r.cuisine}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={async () => {
                              setSelectedRestaurant(r);
                              fetchMenu(r.id);
                              setShowReviews(true);
                            }} 
                            className="px-3 py-1 bg-emerald-600 text-white rounded-md text-sm font-semibold"
                          >
                            View Menu
                          </button>

                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </section>

        {/* Right column removed - restaurants grid now uses full width */}
      </main>

      {/* Menu is now shown inline in the left column when a restaurant is selected */}

      {showReviews && (
        <div className="bg-white rounded-xl p-6 shadow-md mt-6">
        <RestaurantReviews
          restaurantId={selectedRestaurant?.id}
          averageRating={selectedRestaurant?.averageRating}
          totalReviews={selectedRestaurant?.totalReviews || 0}
          ratingDistribution={selectedRestaurant?.ratingDistribution || {}}
          onRatingUpdate={(newAvg) => {
            setSelectedRestaurant(prev => ({
              ...prev,
              averageRating: newAvg
            }));
          }}
          onClose={() => setShowReviews(false)}
        />
        </div>
      )}


      {/* Cart Drawer */}
      {isCartOpen && (
        <aside className={`fixed top-20 right-6 z-60 w-80 bg-white rounded-xl shadow-xl transition-transform overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Cart</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">{cart.reduce((s, i) => s + (i.quantity || 1), 0)} items</div>
              <button onClick={closeCart} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 mt-3 max-h-64 overflow-y-auto">
            {cart.length === 0 && <li className="py-4 text-sm text-gray-500">Cart is empty</li>}
            {cart.map((it, idx) => (
              <li key={idx} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-400">{it.restaurant}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(it.price * (it.quantity || 1))}</div>
                  </div>
                    <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => decreaseQuantity(idx)} className="px-2 py-1 bg-gray-100 rounded">-</button>
                    <div className="text-sm">{it.quantity}</div>
                    <button onClick={() => increaseQuantity(idx)} className="px-2 py-1 bg-gray-100 rounded">+</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="font-bold">{formatCurrency(getCartTotal())}</div>
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-emerald-600 text-white py-2 rounded font-semibold disabled:opacity-60">Checkout</button>
          </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Customer;
