import React from 'react';

interface NavigationButtonProps {
    onNavigate: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ onNavigate }) => {
    return (
        <button
            onClick={onNavigate}
            className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
        >
            <span className="material-icons">📍</span>
            <span className="ml-2">Iniciar Navegación GPS</span>
        </button>
    );
};

export default NavigationButton;