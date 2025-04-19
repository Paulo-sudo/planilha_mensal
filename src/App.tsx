import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Faturamento from "./pages/Faturamento";
import Operacoes from "./pages/Operacoes";

function App() {


  return (
    <div className="body font-lato">
      <Router>
        <Routes>
          {/* Página "Not Found" como rota padrão */}

          <Route path="/" element={<Login/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/faturamento" element={<Faturamento/>} />
          <Route path="/operacoes" element={<Operacoes/>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
