import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Home from './pages/home'
import Chat from './pages/chat'
const router = createBrowserRouter([
  {
    path:"/",
    element: <App />,
    children:[
      {
        path: "/",
        element: <Home/>
      },
      {
        path: "/chat",
        element: <Chat/>
      },
    ]
  },
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
)
