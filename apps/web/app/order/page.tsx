"use client";
import React, { useState } from "react";
import { GoogleMap, LoadScript, Autocomplete, Libraries } from "@react-google-maps/api";

interface Restaurant {
  id: number;
  name: string;
}

const containerStyle = {
  width: "100%",
  height: "0px", // We don't need to display the map now
};

const center = {
  lat: 6.5244, // Lagos coords as fallback
  lng: 3.3792,
};

const libraries: Libraries = ["places"];

const OrderPage: React.FC = () => {
  const [location, setLocation] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string>("");
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const formatted = place.formatted_address || place.name;
      if (formatted) {
        setLocation(formatted);
        setError("");
      }
    }
  };

  const fetchRestaurants = async () => {
    if (!location) {
      setError("Please enter a location.");
      return;
    }

    const mockRestaurants: Restaurant[] = [
      { id: 1, name: "Pizza Place" },
      { id: 2, name: "Sushi Spot" },
      { id: 3, name: "Burger Joint" },
    ];

    setRestaurants(mockRestaurants);
    setError("");
  };

  return (
    <LoadScript
      googleMapsApiKey={"AIzaSyBkqpyzimFzSap3jaPeo5YAPbB3gTK2PVY" as string}
      libraries={libraries}
    >
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex flex-col items-center px-4 pt-20 pb-10">
        {/* Hero Section */}
        <div className="text-center max-w-xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Favorite Food Delivered Fast
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Enter your location to see nearby restaurants and pre-order your
            meal.
          </p>

          {/* Input Section with Autocomplete */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged={handlePlaceChanged}
            >
              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full sm:w-72 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </Autocomplete>

            <button
              onClick={fetchRestaurants}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm"
            >
              Find Restaurants
            </button>
          </div>

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {/* Restaurant List */}
        {restaurants.length > 0 && (
          <div className="mt-12 w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Restaurants near you:
            </h2>
            <ul className="space-y-3">
              {restaurants.map((restaurant) => (
                <li
                  key={restaurant.id}
                  className="bg-white shadow-md p-4 rounded-lg border hover:shadow-lg transition"
                >
                  {restaurant.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Invisible Map (optional, for script context) */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
        />
      </div>
    </LoadScript>
  );
};

export default OrderPage;
