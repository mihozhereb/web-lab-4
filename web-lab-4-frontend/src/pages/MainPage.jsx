// src/pages/MainPage.jsx
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Header } from '../components/header';
import '../styles/layout.css';

function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'));
}

export function MainPage() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) route('/', true);
    else setAllowed(true);
  }, []);

  if (!allowed) return null;

  return (
    <div class="page">
      <Header />
      <main class="container">
        <section class="card">
          <h2 class="card__title">Основная страница</h2>
          <p>Доступ есть, потому что пользователь авторизован.</p>
        </section>
      </main>
    </div>
  );
}
