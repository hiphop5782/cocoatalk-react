import { useEffect, useState } from "react";
import { length } from "./../../node_modules/stylis/src/Tokenizer";

const TextWithEmoji = ({text})=>{
    const [splitTexts, setSplitTexts] = useState([]);
    const [errorList, setErrorList] = useState([]);

    useEffect(()=>{
        if(text.length === 0) return;

        const parts = [];
        const regex = /\[\[(.*?)\]\]/g;

        let lastIndex = 0;
        while(true) {
            const match = regex.exec(text);
            if(match === null) break;
            if(match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            parts.push(match[0]);
            lastIndex = regex.lastIndex;
        }

        if(lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        setSplitTexts(parts);
    }, [text]);

    useEffect(()=>{
        setErrorList(Array.from({length : splitTexts.length}, ()=>false));
    }, [splitTexts]);

    //이모티콘만 있는 경우는 크게
    if(splitTexts.length === 1) {
        const regex = /^\[\[(.*?)\]\]$/;
        const match = splitTexts[0].match(regex);
        if(match) {
            const emojiText = match[1];
            if(errorList[0] === true) {
                <span>{splitTexts[0]}</span>;
            }
            else {
                return <img src={`${process.env.PUBLIC_URL}/assets/emoji/${emojiText}.png`} 
                            style={{width:'10em', height:'10em'}}
                            onError={e=>setErrorList([true])}/>
            }
        }
        return <span>{splitTexts[0]}</span>;
    }

    //나머지는 글자크기에 맞게
    return (
        <span>
            {splitTexts.map((part, i)=>{
                const regex = /^\[\[(.*?)\]\]$/;
                const match = part.match(regex);
                if(match) {
                    const emojiText = match[1];
                    if(errorList[i] === true) {
                        return <span key={i}>{part}</span>;
                    }
                    else {
                        return <img key={i} src={`${process.env.PUBLIC_URL}/assets/emoji/${emojiText}.png`} 
                                    style={{width:'1.5em', height:'1.5em'}}
                                    onError={e=>setErrorList(prev=>prev.map((v, idx)=>idx))}/>
                    }
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default TextWithEmoji;