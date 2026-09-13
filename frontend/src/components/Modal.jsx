function Modal({ aberto, aoFechar, titulo, children }) {
    if (!aberto) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium !text-gray-700">{titulo}</h2>
                    <button
                        onClick={aoFechar}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

export default Modal