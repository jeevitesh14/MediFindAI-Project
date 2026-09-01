import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import store from './store/store';
import AppRoutes from './routes/AppRoutes';
import AiChatWidget from './components/chat/AiChatWidget';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <AiChatWidget />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar limit={1} newestOnTop />

      </BrowserRouter>
    </Provider>
  );
}
