import { createRoot } from "react-dom/client";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register";
import UserRegister from "./pages/UserRegister.jsx";
import CaptainRegister from "./pages/CaptainRegister.jsx";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage.jsx";
import RideBookingPage from "./pages/RideBookingPage.jsx";
import RideHistoryPage from "./pages/RideHistoryPage.jsx";
import CaptainDashbaord from "./pages/CaptainDashboard.jsx";
import CommonLogin from "./pages/CommonLogin.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import CaptainProfile from "./pages/CaptainProfile.jsx";
import CaptainRides from "./pages/CaptainRides.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ToastProvider } from "./components/ui/toast";


const router = createBrowserRouter([
     {
          path : "/",
          element : <LandingPage/>
     },
     {
          path : "/register",
          element : <Register/>
     },
     {
          path : "/register-user",
          element : <UserRegister/>
     },
     {
          path : "/register-captain",
          element : <CaptainRegister/>
     },
     {
          path : "/login",
          element : <CommonLogin/>
     },
     {
          path : "/dashboard",
          element : (
               <ProtectedRoute requiredRole="user">
                    <DashboardPage/>
               </ProtectedRoute>
          )
     },
     {
          path : "/book-ride",
          element : (
               <ProtectedRoute requiredRole="user">
                    <RideBookingPage/>
               </ProtectedRoute>
          )
     },
     {
          path : "/ride-history",
          element : (
               <ProtectedRoute requiredRole="user">
                    <RideHistoryPage/>
               </ProtectedRoute>
          )
     },
     {
          path: "/profile",
          element: (
               <ProtectedRoute requiredRole="user">
                    <UserProfile />
               </ProtectedRoute>
          )
     },
      {
          path : "/homepage-captain",
          element : (
               <ProtectedRoute requiredRole="captain">
                    <CaptainDashbaord/>
               </ProtectedRoute>
          )
     }
	 ,
	 {
		  path: "/captain/profile",
		  element: (
               <ProtectedRoute requiredRole="captain">
                    <CaptainProfile />
               </ProtectedRoute>
          )
	 }
      ,
      {
            path: "/captain/rides",
            element: (
               <ProtectedRoute requiredRole="captain">
                    <CaptainRides />
               </ProtectedRoute>
          )
      },
      {
            path: "/unauthorized",
            element: <UnauthorizedPage />
      },
      {
            path: "*",
            element: <NotFoundPage />
      }
])
createRoot(document.getElementById('root')).render(
     <ToastProvider>
          <RouterProvider router={router} />
     </ToastProvider>
)
