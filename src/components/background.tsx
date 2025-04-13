import { createPortal } from "react-dom";


interface BackgroundProps {
    children?: React.ReactNode;// 'origin' é opcional

}

const Background: React.FC<BackgroundProps> = (props) => {
    const {  children } = props;
    return (
        <>
            {createPortal(
                <div  className={"bg-[#1e1b4b82]  fixed w-screen h-screen top-0 p-4 overflow-y-scroll "}>

                    {children} {/* Renderiza os filhos, se houver */}
                </div>,
                document.getElementById("background-root") as HTMLElement // Assegura que o elemento existe
            )}
        </>
    );
};

export default Background;
