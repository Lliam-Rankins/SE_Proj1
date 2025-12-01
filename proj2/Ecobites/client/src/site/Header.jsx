import { useNavigate, useLocation, NavLink, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";


export default function SiteHeader({ onMenuClick, showMenuButton }) {
  const { isAuthenticated, logout, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role;

  const getDashboardLink = () => {
    switch (role) {
      case "customer":
        return "/customer";
      case "restaurant":
        return "/restaurants";
      case "driver":
        return "/driver";
      default:
        return "/login";
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const baseNavClasses = "px-4 py-2 rounded-lg transition-all duration-200 font-medium";
  const defaultNavClasses = "text-gray-700 hover:text-emerald-600 hover:bg-emerald-50";
  const highlightActiveClasses = "bg-emerald-600 text-white shadow-sm";
  const navLinkClass = ({ isActive }) =>
    `${baseNavClasses} ${isActive ? highlightActiveClasses : defaultNavClasses}`;
  const impactLinkClass = navLinkClass;
  const dashboardPath = getDashboardLink();
  const isCustomerImpact = role === 'customer' && location.pathname.startsWith('/customer/impact');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white text-xl font-bold">🍃</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              EcoBites
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {!isAuthenticated && (
              <>
                <NavLink 
                  to="/restaurants" 
                  className={navLinkClass}
                >
                  Restaurants
                </NavLink>
                <NavLink 
                  to="/customer" 
                  className={navLinkClass}
                >
                  Customers
                </NavLink>
                <NavLink 
                  to="/driver" 
                  className={navLinkClass}
                >
                  Drivers
                </NavLink>
              </>
            )}
            <NavLink 
              to="/about" 
              className={navLinkClass}
            >
              About
            </NavLink>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Conditional Buttons */}
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  className={navLinkClass}
                >
                  Login
                </NavLink>
              </>
            ) : (
              <>
                {role === 'customer' && (
                  <NavLink
                    to="/customer/impact"
                    className={impactLinkClass}
                  >
                    Impact
                  </NavLink>
                )}
                <NavLink
                  to={dashboardPath}
                  className={({ isActive }) =>
                    navLinkClass({ isActive: isActive && !isCustomerImpact })
                  }
                >
                  {role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard` : 'Dashboard'}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {showMenuButton && (
            <button 
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
