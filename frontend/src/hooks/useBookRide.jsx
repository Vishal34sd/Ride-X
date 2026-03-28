import { useState } from "react";
import axios from "axios";
import { getAccessToken } from "../helper/Token.js";
import { apiUrl } from "../lib/apiUrl";
export default function useBookRide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookRide = async ({ pickup, destination, vehicleType }) => {
    setLoading(true);
    setError(null);

   try {
  const token = getAccessToken();

  const res = await axios.post(
    apiUrl("/api/v1/rides/create"),
    {
      pickup,
      destination,
      vehicleType,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
