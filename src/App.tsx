import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Faturamento from "./pages/Faturamento";

function App() {


  return (
    <div className="body font-lato">
      <Router>
        <Routes>
          {/* Página "Not Found" como rota padrão */}

          <Route path="/" element={<Login/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/faturamento" element={<Faturamento/>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
