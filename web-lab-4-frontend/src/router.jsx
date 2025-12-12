import Router from 'preact-router';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';

export function AppRouter() {
  return (
    <Router>
      <LoginPage path="/" />
      <MainPage path="/app" />
    </Router>
  );
}
