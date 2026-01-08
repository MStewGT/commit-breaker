import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Embed from './pages/Embed'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/embed" element={<Embed />} />
    </Routes>
  )
}
