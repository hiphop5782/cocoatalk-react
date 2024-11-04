import emojiJson from "@src/assets/json/emoji.json";
import { useState } from "react";
import "./EmojiContainer.css";
import { FaXmark } from "react-icons/fa6";

const EmojiContainer = ({
    onEmojiSelect, 
    onEmojiClose,
})=>{
    const [emojiList, setEmojiList] = useState(emojiJson);

    return (
        <div className="emoji-container">
            <FaXmark className="fs-2 emoji-container-close" onClick={onEmojiClose}/>
            <div className="row">
                <div className="col">
                    {emojiList.map((emoji, index)=>(
                        <button className="btn" key={index} onClick={e=>onEmojiSelect(emoji, e)}>
                            <img src={`${process.env.PUBLIC_URL}/assets/emoji/${emoji.name}.${emoji.type}`}/>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmojiContainer;