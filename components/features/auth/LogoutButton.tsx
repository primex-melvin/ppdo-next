"use client";

interface LogoutButtonProps {
  onClick: () => void;
}

export function LogoutButton({ onClick }: LogoutButtonProps) {
  return (
    <>
      <style>{`
        .logout-btn {
          --night-rider: #2e2e2e;
          --af-white: #f3f3f3;
          --night-rider-dark: #1a1a1a;
          --af-white-dark: #e5e5e5;
          
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 45px;
          height: 45px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition-duration: 0.3s;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.199);
          background-color: var(--night-rider);
        }

        .dark .logout-btn {
          background-color: var(--night-rider-dark);
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.399);
        }

        .logout-btn-sign {
          width: 100%;
          transition-duration: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout-btn-sign svg {
          width: 17px;
        }

        .logout-btn-sign svg path {
          fill: var(--af-white);
        }

        .dark .logout-btn-sign svg path {
          fill: var(--af-white-dark);
        }

        .logout-btn-text {
          position: absolute;
          right: 0%;
          width: 0%;
          opacity: 0;
          color: var(--af-white);
          font-size: 1.2em;
          font-weight: 600;
          transition-duration: 0.3s;
        }

        .dark .logout-btn-text {
          color: var(--af-white-dark);
        }

        .logout-btn:hover {
          width: 125px;
          border-radius: 5px;
          transition-duration: 0.3s;
        }

        .logout-btn:hover .logout-btn-sign {
          width: 30%;
          transition-duration: 0.3s;
          padding-left: 20px;
        }

        .logout-btn:hover .logout-btn-text {
          opacity: 1;
          width: 70%;
          transition-duration: 0.3s;
          padding-right: 10px;
        }

        .logout-btn:active {
          transform: translate(2px, 2px);
        }
      `}</style>
      <button onClick={onClick} className="logout-btn">
        <div className="logout-btn-sign">
          <svg viewBox="0 0 512 512">
            <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
          </svg>
        </div>
        <div className="logout-btn-text">Logout</div>
      </button>
    </>
  );
}


