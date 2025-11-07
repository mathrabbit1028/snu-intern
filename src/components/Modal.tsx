import { useNavigate } from 'react-router-dom';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  showLoginButton?: boolean;
}

const Modal = ({ isOpen, onClose, title, message, showLoginButton = false }: ModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          {showLoginButton && (
            <button className="modal-button modal-button-primary" onClick={handleLogin}>
              로그인하기
            </button>
          )}
          <button className="modal-button modal-button-secondary" onClick={onClose}>
            뒤로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
