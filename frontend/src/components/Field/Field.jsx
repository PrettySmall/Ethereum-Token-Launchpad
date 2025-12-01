/* eslint-disable react/prop-types */
export const Field = (props) => {
    return (
        <div className={`${props.className} flex items-center p-px rounded-xl bg-gray-gradient`}>
            <div className={`rounded-xl bg-black px-1.5 py-0.5 w-full h-full`}>
                {props.children}
            </div>
        </div>
    )
}