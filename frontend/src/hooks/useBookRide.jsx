import { useState } from "react";
import axios from "axios";

export default function useBookRide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookRide = async ({ pickup, destination, vehicleType }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/rides/create",
        {
          pickup,
          destination,
          vehicleType,
        }
      );

      return res.data.ride;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Ride booking failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { bookRide, loading, error };
}
