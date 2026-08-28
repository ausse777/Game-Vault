import { useEffect, useState } from 'react';

const VISIBILITY_THRESHOLD = 300;

export const JumpToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(() => window.scrollY > VISIBILITY_THRESHOLD);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > VISIBILITY_THRESHOLD);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="jump-to-top"
      type="button"
      aria-label="Jump to the top"
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
    >
      ↑ Top
    </button>
  );
};
