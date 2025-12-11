import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register"
import UserRegister from "./pages/UserRegister.jsx"
import CaptainRegister from "./pages/CaptainRegister.jsx"
import LandingPage from "./pages/LandingPage";
import UserHomePage from "./pages/UserHomePage.jsx"


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
          path : "/homepage-user",
          element : <UserHomePage/>
     }
])
createRoot(document.getElementById('root')).render(
  
     <RouterProvider router={router} />
  
)
