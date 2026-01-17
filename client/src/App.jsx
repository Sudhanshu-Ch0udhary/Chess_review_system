import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NewGamePage from './pages/NewGamePage'
import GamesListPage from './pages/GamesListPage'
import GameReviewPage from './pages/GameReviewPage'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <a href="/" className="nav-logo">Chess Review</a>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <a href="/games">My Games</a>
                <a href="/games/new">Upload Game</a>
                <LogoutButton />
              </>
            ) : (
              <>
                <a href="/login">Login</a>
                <a href="/signup">Sign Up</a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/games" replace /> : <LoginPage />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/games" replace /> : <SignupPage />} 
          />
          <Route 
            path="/games" 
            element={
              <ProtectedRoute>
                <GamesListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/new" 
            element={
              <ProtectedRoute>
                <NewGamePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/games/:id" 
            element={
              <ProtectedRoute>
                <GameReviewPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }
  return (
    <button onClick={handleLogout} className="nav-button">
      Logout
    </button>
  )
}

export default App