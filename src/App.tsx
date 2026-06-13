import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Contacts from './pages/Contacts'
import Templates from './pages/Templates'
import Campaigns from './pages/Campaigns'
import Flows from './pages/Flows'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/companies" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
