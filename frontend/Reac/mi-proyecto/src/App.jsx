import './App.css';
import Navbar from './Navbar';
import Footer from './Footer';
import Inicio from './components/Inicio';
import Proyectos from './components/Proyectos';
import Productos from './components/Productos';
import LoginInicioSesion from './components/LOGIN/LoginInicioSesion';
import LoginPersonal from './components/LoginPersonal';
import { Route, Routes, useLocation } from 'react-router-dom';

import Carrito from './components/Carrito';
import Almacen from './components/ALMACÉN/AlmacenBody';
import Administracion from './components/ADMINISTRACIÓN/Administracion';
import CompletaDatosGoogle from './components/CompletaDatosGoogle';
import Obras from './components/OBRAS/GestionObras';
import PanelCliente from './components/PanelCliente';

function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<LoginInicioSesion />} />
          <Route path="/personal" element={<LoginPersonal />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/almacen" element={<Almacen />} />
          <Route path="/administracion" element={<Administracion />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/operaciones" element={<Obras />} />
          <Route path="/completa-datos-google" element={<CompletaDatosGoogle />} />
          <Route path="/user" element={<PanelCliente />} />
          <Route path="/panelcliente" element={<PanelCliente />} />
        </Routes>
      </main>
      {location.pathname !== "/login" && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppLayout />
  );
}

export default App;
