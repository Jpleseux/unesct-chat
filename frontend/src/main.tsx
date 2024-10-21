import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Home from './pages/home'
const router = createBrowserRouter([
  {
    path:"/",
    element: <App />,
    children:[
      {
        path: "/",
        element: <Home/>
      },
    ]
  },
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
)
