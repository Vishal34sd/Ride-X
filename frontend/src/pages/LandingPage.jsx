import React from "react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 border-b bg-black">
        <div className="text-3xl font-bold tracking-tight text-white">Uber</div>

        <div className="hidden md:flex space-x-5 text-[15px] text-white mr-96">
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Ride</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Drive</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Business</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">About</a>
        </div>

        <div className="flex space-x-2 text-[15px] items-center">
          <button className=" hover:bg-gray-700 rounded-full  px-5 py-2 text-white">Help</button>
          <button className="hover:bg-gray-700 rounded-full  px-5 py-2 text-white">Log in</button>
          <button className="bg-white text-black px-5 py-2 rounded-full font-medium">
            Sign up
          </button>
        </div>
      </nav>

      {/* Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-10 py-16">

        {/* Left */}
        <div>
          <p className="text-gray-700 mb-1 flex items-center text-[15px]">
            📍 Bhopal, IN
          </p>

          <h1 className="text-[44px] leading-tight font-bold text-black mb-4">
            Request a ride for <br /> now or later
          </h1>

          <p className="text-gray-500 text-[15px] mb-6">
            Up to 50% off your first 5 Uber rides. T&Cs apply.*
          </p>

          <button className="border border-gray-300 px-4 py-2 rounded-full text-[15px] font-medium mb-4 bg-gray-200">
            Pickup now
          </button>

          {/* Inputs */}
          <div className="space-y-3 ">
            <input
              placeholder="Pickup location"
              className="w-full border border-gray-300 rounded-lg p-3 text-[15px] focus:outline-black bg-gray-100"
            />

            <input
              placeholder="Dropoff location"
              className="w-full border border-gray-300 rounded-lg p-3 text-[15px] focus:outline-black bg-gray-100"
            />
          </div>

          <button className="mt-6 bg-black text-white px-6 py-3 rounded-lg font-medium text-[15px]">
            See prices
          </button>
        </div>

        {/* Right Image */}
        <div className="flex justify-center">
          <img
            src="/trip1.png"
            alt="Ride illustration"
            className="rounded-xl w-full max-w-md shadow-md "
          />
        </div>
      </div>

      {/* Suggestions */}
      <div className="px-10 pb-20">
        <h2 className="text-3xl font-semibold mb-6 text-black">
          Suggestions
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {["Ride", "Reserve", "Intercity", "Courier", "Rentals", "Bike"].map(
            (item) => (
              <div
                key={item}
                className="border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-lg transition cursor-pointer bg-white"
              >
                <h3 className="font-semibold text-[17px] mb-2 text-black">
                  {item}
                </h3>

                <p className="text-gray-600 text-[14px] mb-4 leading-snug">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>

                <button className="border border-gray-300 px-4 py-1 rounded-md text-[14px] font-medium hover:border-black">
                  Details
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
