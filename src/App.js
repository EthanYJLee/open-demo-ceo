import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/main.scss";
import Dashboard from "./pages/Dashboard";
import BranchManagement from "./pages/BranchManagement";
import LayoutEditor from "./pages/LayoutEditor";
import Sidebar from "./components/common/Sidebar";

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/branches" element={<BranchManagement />} />
            <Route path="/layout/:branchId" element={<LayoutEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
