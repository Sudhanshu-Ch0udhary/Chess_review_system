import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './HomePage.css'

function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="home-page">
      <h1>Chess Review System</h1>
      <p>Review and analyze your chess games</p>
      
      {isAuthenticated ? (
        <>
          <p>Welcome back, {user?.username}!</p>
          <div className="home-actions">
            <Link to="/games/new" className="btn btn-primary">
              Upload New Game
            </Link>
            <Link to="/games" className="btn btn-secondary">
              View My Games
            </Link>
          </div>
        </>
      ) : (
        <>
          <p>Sign up or login to start reviewing your chess games</p>
          <div className="home-actions">
            <Link to="/signup" className="btn btn-primary">
              Sign Up
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage