import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Agenda from './pages/Agenda'
import Clientes from './pages/Clientes'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="*" element={<div className="card">Página no encontrada. <a href="/">Volver</a></div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
