import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import BranchManagement from "./pages/BranchManagement";
import LayoutEditor from "./pages/LayoutEditor";
import Sidebar from "./components/common/Sidebar";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
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
