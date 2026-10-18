import useModalDialog from '../hooks/useModalDialog.js';
import Icon from './Icon.jsx';

export default function Lightbox({ photo, onClose }) {
  const dialogRef = useModalDialog();

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={photo.alt}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className="lightbox-close"
        onClick={onClose}
        aria-label="Tutup gambar"
        autoFocus
      >
        <Icon name="close" />
      </button>
      <img src={photo.src} alt={photo.alt} />
      <p>{photo.title}</p>
    </dialog>
  );
}
