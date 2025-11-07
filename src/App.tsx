import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Modal from './components/Modal';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Posts from './pages/Posts';
import Signup from './pages/Signup';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <NavBar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Posts />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/posts" element={<Posts />} />
            </Routes>
          </main>
          {/* Keep Modal in graph for future use; remains hidden when open=false */}
          <Modal
            open={false}
            onClose={() => {
              /* noop */
            }}
          >
            {null}
          </Modal>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
