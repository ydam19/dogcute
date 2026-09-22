import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PetProvider } from './context/PetContext'
import { InputForm } from './pages/InputForm'
import { CardPage } from './pages/CardPage'
import { FeedPage } from './pages/FeedPage'
import './index.css'

export default function App() {
  return (
    <PetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InputForm />} />
          <Route path="/card" element={<CardPage />} />
          <Route path="/feed" element={<FeedPage />} />
        </Routes>
      </BrowserRouter>
    </PetProvider>
  )
}
