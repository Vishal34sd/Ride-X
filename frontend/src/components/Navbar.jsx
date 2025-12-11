

const Navbar = () => {
    return (
      <nav className="w-full flex justify-between items-center px-8 py-4 border-b bg-black">
        <div className="text-3xl font-bold tracking-tight text-white">Uber</div>

        <div className="hidden md:flex space-x-5 text-[15px] text-white mr-96">
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Ride</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Drive</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">Business</a>
          <a href="#" className="hover:bg-gray-700 rounded-full  px-5 py-2">About</a>
        </div>
      </nav>
    );
}

export default Navbar ;