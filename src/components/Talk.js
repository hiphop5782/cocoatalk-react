import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Talk.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import moment from "moment";
import "moment/locale/ko";
import { useRecoilValue } from "recoil";
import { nicknameState, profileState } from "@src/utils/recoil";

import axios from "axios";
import TextWithEmoji from "./TextWithEmoji";

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

    //view
    return (
        <div className="cocoa-container">

            <div className="container-fluid">

                <div className="row">
                    <div className="col">

                        <div className="fullscreen">

                            {/* 메세지 입력창 */}
                            <div className="input-container">
                                <textarea name="content" value={message.content} onChange={inputMessageContent} onKeyDown={pressKeyAction}
                                    className="form-control" style={{ height: 150 }} />
                            </div>

                            {/* 메세지 출력창 */}
                            <div className="message-container d-flex flex-column" ref={historyWrapper}>
                                {history.map((m, i) => (<div key={i}>
                                    {/* 일반 메세지 */}
                                    <div className={`message-wrapper${m.sender === nickname ? ' my' : ''}`}>
                                        {m.type === "message" && (<>
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
                                        </>)}
                                    </div>
                                    {/* 시스템 메세지 */}
                                    {m.type === "system" && (
                                        <div className="system-wrapper">
                                            {m.action === "enter" ? `${m.nickname} 님이 입장하셨습니다` : `${m.nickname} 님이 퇴장하셨습니다`}
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