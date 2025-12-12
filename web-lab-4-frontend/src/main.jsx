import { render } from 'preact';
import { AppRouter } from './router';
import './styles/layout.css';

const rootElement = document.getElementById('app');

render(<AppRouter />, rootElement);
