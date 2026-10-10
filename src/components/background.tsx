import { createPortal } from "react-dom";


interface BackgroundProps {
    children?: React.ReactNode;

}

const Background: React.FC<BackgroundProps> = (props) => {
    const {  children } = props;
    return (
        <>
            {createPortal(
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                        {children}
                    </div>
                </div>,
                document.getElementById("background-root") as HTMLElement // Assegura que o elemento existe
            )}
        </>
    );
};

export default Background;
