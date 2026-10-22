import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-6">

      <Link
        to="/"
        className="text-3xl font-bold text-blue-600"
      >
        WorkSphere
      </Link>

      <div className="flex gap-4">

        <Link
          to="/ceo/login"
          className="text-blue-600 hover:underline"
        >
          CEO Login
        </Link>

        <Link
          to="/employee/login"
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Employee Login
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;