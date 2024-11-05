import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Talk.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import { PiMicrophoneStageFill } from "react-icons/pi";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";
import { TbCaptureFilled } from "react-icons/tb";
import { FaDownload } from "react-icons/fa";

import moment from "moment";
import "moment/locale/ko";
import { useRecoilValue } from "recoil";
import { nicknameState, profileState } from "@src/utils/recoil";

import axios from "axios";
import TextWithEmoji from "./TextWithEmoji";
import EmojiContainer from "./EmojiContainer";
import { filesize } from "filesize";

const Talk = () => {
    //state
    const [message, setMessage] = useState({ content: "" });
    const [history, setHistory] = useState([]);

    //recoil
    const nickname = useRecoilValue(nicknameState);
    const profile = useRecoilValue(profileState);

    //callback
    const inputMessageContent = useCallback((e) => {
        setMessage({
            ...message,
            [e.target.name]: e.target.value
        });
    }, [message]);

    const pressKeyAction = useCallback(e => {
        if (e.altKey && e.key === 'Enter') {//alt+enter
            setMessage({ ...message, content: message.content + "\n" });
        }
        else if (e.key === 'Enter') {//enter
            e.preventDefault();
            sendMessage();
        }
    }, [message]);

    const sendMessage = useCallback(() => {
        if (message.content.trim().length === 0) return;
        client.publish({
            destination: "/talk/public/messages",
            headers: {
                nickname: nickname
            },
            body: JSON.stringify(message)
        })
        setMessage({ ...message, content: "" });
    }, [message]);

    //메세지 수신 시 스크롤 자동 이동
    const historyWrapper = useRef();
    useLayoutEffect(() => {
        if(historyWrapper.current) {
            setTimeout(()=>{
                historyWrapper.current.scrollTop = historyWrapper.current.scrollHeight;
            }, 1);
        }
    }, [history]);

    //websocket
    const [client, setClient] = useState(null);
    const [connect, setConnect] = useState(false);

    useEffect(() => {
        if (!nickname || !profile) return;

        sendProfileToServer(nickname, profile);

        const stompClient = connectToServer(nickname);
        setClient(stompClient);
        return () => {
            disconnectFromServer(stompClient);
        };
    }, [nickname, profile]);

    const sendProfileToServer = useCallback(async (nickname, profile) => {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/profile/`, { nickname: nickname, profile: profile });
    }, []);

    const connectToServer = useCallback((nickname) => {
        const socket = new SockJS(`${process.env.REACT_APP_BACKEND_URL}/socket`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                nickname: nickname
            },
            onConnect: () => {
                //public channel
                stompClient.subscribe("/public/messages", (message) => {
                    const convertMessage = JSON.parse(message.body);
                    convertMessage.type = "message";
                    setHistory(prev => [...prev, convertMessage]);
                });
                stompClient.subscribe("/public/users", (message) => {});
                stompClient.subscribe("/public/system", (message) => {
                    const convertMessage = JSON.parse(message.body);
                    convertMessage.type = "system";
                    setHistory(prev => [...prev, convertMessage]);
                });
                stompClient.subscribe("/public/files", (message)=>{
                    const convertMessage = JSON.parse(message.body);
                    convertMessage.type = "file";
                    setHistory(prev => [...prev, convertMessage]);
                });
                //group channel
                //stompClient.subscribe("/group/messages", (message)=>{});
                //stompClient.subscribe("/group/users", (message)=>{});
                //stompClient.subscribe("/group/alerts", (message)=>{});

                setConnect(true);
            },
            onDisconnect: () => {
                setConnect(false);
             },
            // debug: (str)=>{console.log(str)},
        });
        stompClient.activate();
        return stompClient;
    }, []);

    const disconnectFromServer = useCallback(() => {
        if (client) {
            client.deactivate();
        }
    }, []);

    //동일 작성자 & 시간 검사
    const checkSameSenderAndSameTime = useCallback((a, b) => {
        if (!a || !b) return false;

        const checkSameSender = a.sender && b.sender && a.sender === b.sender;
        const checkSameTime = moment(a.time).format('YYYY-MM-DD H:mm') === moment(b.time).format('YYYY-MM-DD H:mm');
        return checkSameSender === true && checkSameTime === true;
    }, []);  


    //emoji
    const [openEmojiTab, setOpenEmojiTab] = useState(false);
    const [openAttachmentTab, setOpenAttachmentTab] = useState(false);
    const [openCaptureTab, setOpenCaptureTab] = useState(false);
    const [openShoutTab, setOpenShoutTab] = useState(false);

    const changeTab = useCallback((mode)=>{
        switch(mode) {
            case 'emoji' : 
                setOpenEmojiTab(!openEmojiTab); 
                setOpenAttachmentTab(false); 
                setOpenCaptureTab(false); 
                setOpenShoutTab(false); 
                break;
            case 'attachment' : 
                setOpenEmojiTab(false); 
                setOpenAttachmentTab(!openAttachmentTab); 
                setOpenCaptureTab(false); 
                setOpenShoutTab(false); 
                break;
            case 'capture': 
                setOpenEmojiTab(false); 
                setOpenAttachmentTab(false); 
                setOpenCaptureTab(!openCaptureTab); 
                setOpenShoutTab(false); 
                break;
            case 'shout': 
                setOpenEmojiTab(false); 
                setOpenAttachmentTab(false); 
                setOpenCaptureTab(false); 
                setOpenShoutTab(!openShoutTab); 
                break;
            default:
                setOpenEmojiTab(false); 
                setOpenAttachmentTab(false); 
                setOpenCaptureTab(false); 
                setOpenShoutTab(false); 
                break;
        }
    }, [openEmojiTab, openAttachmentTab, openCaptureTab, openShoutTab]);

    const selectEmoji = useCallback((emoji)=>{
        setMessage({
            ...message,
            content: message.content + `[[${emoji.name}]]`
        });
    }, [message, openEmojiTab]);

    const fileSelector = useRef();
    useEffect(()=>{
        if(openAttachmentTab === false) return;
        fileSelector.current.click();
    }, [openAttachmentTab]);

    const onFileSelected = useCallback((e)=>{
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.addEventListener("load", async (e)=>{
            //파일업로드 비동기요청
            const resp = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/attachment/`, {
                fileName: file.name,
                fileContent: e.target.result
            });
            //파일업로드 완료 후 웹소켓 메세지 전송
            client.publish({
                destination: "/talk/public/files",
                headers: {
                    nickname: nickname
                },
                body: JSON.stringify({fileName : resp.data.fileName})
            })
        });
        reader.readAsDataURL(file);
    }, [client]);

    //view
    return (
        <div className="cocoa-container">

            <div className="container-fluid">

                <div className="row">
                    <div className="col">

                        <div className="fullscreen">

                            {/* 메세지 입력창 */}
                            <div className="input-container">
                                <div className="row">
                                    <div className="col">
                                        <textarea name="content" value={message.content} onChange={inputMessageContent} onKeyDown={pressKeyAction}
                                            className="form-control p-3 fs-3" style={{ height: 150 }} 
                                            placeholder="메시지 입력"/>
                                    </div>
                                </div>
                                <div className="row mt-2 px-3">
                                    <div className="col-8 text-start">
                                        <button className="btn" data-bs-toggle="tooltip" data-bs-placement="top" title="이모티콘"
                                            onClick={e=>changeTab('emoji')}>
                                            <BsEmojiSmile className="fs-1"/>
                                        </button>
                                        <button className="btn" data-bs-toggle="tooltip" data-bs-placement="top" title="첨부파일"
                                            onClick={e=>changeTab('attachment')}>
                                            <FaPaperclip className="fs-1"/>
                                        </button>
                                        <button className="btn" data-bs-toggle="tooltip" data-bs-placement="top" title="대화캡쳐"
                                            onClick={e=>changeTab('capture')} disabled={true}>
                                            <TbCaptureFilled className="fs-1"/> 
                                        </button>
                                        <button className="btn" data-bs-toggle="tooltip" data-bs-placement="top" title="외치기"
                                            onClick={e=>changeTab('shout')} disabled={true}>
                                            <PiMicrophoneStageFill className="fs-1"/>
                                        </button>

                                        <input type="file" ref={fileSelector} onChange={onFileSelected} className="d-none"/>

                                    </div>

                                    <div className="col-4 text-end">
                                        <button className="btn btn-success btn-lg" 
                                                disabled={message.content.length === 0} onClick={sendMessage}>
                                            전송
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 이모지 선택창 */}
                            {openEmojiTab && <EmojiContainer onEmojiClose={changeTab} onEmojiSelect={selectEmoji}/>}

                            {/* 메세지 출력창 */}
                            <div className="message-container d-flex flex-column" ref={historyWrapper}>
                                {history.map((m, i) => (<div key={i}>
                                    {/* 일반 메세지 */}
                                    {m.type === "message" && (<>
                                        <div className={`message-wrapper${m.sender === nickname ? ' my' : ''}`}>
                                            {m.sender !== nickname && (
                                                <div className="profile-wrapper">
                                                {checkSameSenderAndSameTime(m, history[i-1]) === false && (
                                                    <div className="profile me-2">
                                                        <img src={`${process.env.REACT_APP_BACKEND_URL}/profile/${m.sender}`} />
                                                    </div>
                                                )}
                                                </div>
                                            )}

                                            <div className="content-wrapper">
                                                {(m.sender !== nickname && checkSameSenderAndSameTime(m, history[i-1]) === false) && (
                                                <div className="sender">{m.sender}</div>
                                                )}
                                                <div className="content">
                                                    {/* img 태그를 찾아 렌더링 처리 */}
                                                    <TextWithEmoji text={m.content}/>
                                                </div>
                                            </div>

                                            {/* 시간 출력(다음 메세지가 동일 작성자에 같은 시간이면 미출력) */}
                                            {checkSameSenderAndSameTime(m, history[i + 1]) === false && (
                                                <div className="time">{moment(m.time).format("a h:mm")}</div>
                                            )}
                                        </div>
                                    </>)}
                                    {/* 시스템 메세지 */}
                                    {m.type === "system" && (
                                        <div className="system-wrapper">
                                            {m.action === "enter" ? `${m.nickname} 님이 입장하셨습니다` : `${m.nickname} 님이 퇴장하셨습니다`}
                                        </div>
                                    )}
                                    {/* 파일 메세지 */}
                                    {m.type === "file" && (
                                        <div className={`file-wrapper${m.sender !== nickname ? '' : ' my'}`}>
                                            <div className="fs-4 text-primary d-flex justify-content-between align-items-center">
                                                <span>첨부파일</span>
                                                <a className="link-underline-opacity-0" href={`${process.env.REACT_APP_BACKEND_URL}/attachment/${m.realName}`}>
                                                    <FaDownload/>
                                                </a>
                                            </div>
                                            <hr/>
                                            <div className="text-dark">{m.fileName}</div>
                                            <div className="text-muted mt-4">
                                                <span>유효기간</span>
                                                <span className="ms-3">{moment(m.expire).format('YYYY-MM-DD a h:mm:ss')}</span>
                                            </div>
                                            <div className="text-muted mt-1">
                                                <span>용량</span>
                                                <span className="ms-3">{filesize(m.fileSize)}</span>
                                            </div>
                                            {m.fileType && (
                                            <div className="text-muted mt-1">
                                                <span>유형</span>
                                                <span className="ms-3">{m.fileType}</span>
                                            </div>
                                            )}
                                            <div className="text-info mt-4">
                                                <a href={`${process.env.REACT_APP_BACKEND_URL}/attachment/${m.realName}`} 
                                                    className="link-offset-2 link-offset-2-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover">다운로드</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                ))}
                            </div>

                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default Talk;