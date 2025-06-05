import Link from "next/link";
import { Home, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function UserNavbar() {
  const { signOut } = useAuthContext();

  return (
    <>
        {/* Desktop Top Navbar */}  
      <nav className="hidden md:flex w-full bg-white shadow-md fixed top-0 left-0 z-50 px-4 py-3 items-center justify-between">
        <Link
          href="/"
          className="hidden md:flex text-md gap-2 font-bold text-orange-600 items-center"
        >
          <span className="mr-1">
              <Home size={16} />  
          </span>
          Sazee
        </Link>

        <div className="flex space-x-6 text-sm font-medium">
          <Link href="/user" className="hover:text-primary">
            Home
          </Link>
          {/* <Link href="/user/orders" className="hover:text-primary">
            Orders
          </Link> */}
          {/* <Link href="/user/cart" className="hover:text-primary">
            Cart
          </Link> */}
          <Link href="/user/category" className="hover:text-primary">
            Vendors
          </Link>
          <Link href="/user/profile" className="hover:text-primary">
            Profile
          </Link>
          <button className="hover:text-red-500" onClick={signOut}>
            Logout
          </button>
        </div>
      </nav>
      
        {/* Mobile Bottom Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99] bg-white border-t shadow-md">
        <div className="flex justify-around text-xs text-center py-2">
          <Link
            href="/user"
            className="flex flex-col items-center text-gray-700 hover:text-orange-600"
          >
            <Home size={20} />  <span>Home</span> 
          </Link>
          <Link
            href="/user/category"
            className="flex flex-col items-center text-gray-700 hover:text-orange-600"
          >
              <ClipboardList size={20} />
            <span>Vendor</span>
          </Link>
          <Link
            href="/user/cart"
            className="flex flex-col items-center text-gray-700 hover:text-orange-600"
          >
            <ShoppingCart size={20} />  <span>Cart</span> 
          </Link>
          <Link
            href="/user/profile"
            className="flex flex-col items-center text-gray-700 hover:text-orange-600"
          >
              <User size={20} />  <span>Profile</span>  
          </Link>
        </div>
      </div>
    </>
  );
}
