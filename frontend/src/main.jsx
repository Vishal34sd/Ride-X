import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register"
import UserRegister from "./pages/UserRegister.jsx"
import CaptainRegister from "./pages/CaptainRegister.jsx"
import LandingPage from "./pages/LandingPage";
import UserHomePage from "./pages/UserHomePage.jsx";
import CaptainDashbaord from "./pages/CaptainDashboard.jsx";
import CommonLogin from "./pages/CommonLogin.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import StatusPage from "./pages/StatusPage.jsx";
import CaptainProfile from "./pages/CaptainProfile.jsx";
import CaptainRides from "./pages/CaptainRides.jsx";


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
          path : "/homepage-user",
          element : <UserHomePage/>
     },
     {
          path: "/profile",
          element: <UserProfile />
     },
     {
          path: "/status",
          element: <StatusPage />
     },
      {
          path : "/homepage-captain",
          element : <CaptainDashbaord/>
     }
	 ,
	 {
		  path: "/captain/profile",
		  element: <CaptainProfile />
	 }
      ,
      {
            path: "/captain/rides",
            element: <CaptainRides />
      }
])
createRoot(document.getElementById('root')).render(
  
     <RouterProvider router={router} />
  
)
