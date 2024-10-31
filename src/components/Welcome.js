import { debounce, size } from "lodash";
import "./Welcome.css";
import CocoaImage from "@src/assets/images/cocoa.png";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useRecoilState } from "recoil";
import { nicknameState, profileState } from "@src/utils/recoil";
import axios from "axios";

const Welcome = ()=>{
    //util
    const navigate = useNavigate();

    //state
    const [nicknameValid, setNicknameValid] = useState(false);
    const [nicknameUsing, setNicknameUsing] = useState(false);
    const [profileValid, setProfileValid] = useState(false);

    const [previewBlob, setPreviewBlob] = useState(null);

    //recoil
    const [nickname, setNickname] = useRecoilState(nicknameState);
    const [profile, setProfile] = useRecoilState(profileState);

    //effect
    useEffect(()=>{
        checkNickname(nickname);
    }, [nickname]);
    useEffect(()=>{
        setProfileValid(profile.length > 0);
        if(profile.length > 0) {
            setPreviewBlob(profile);
        }
    }, [profile]);

    //memo

    //callback
    const chooseProfile = useCallback(e=>{
        const files = e.target.files;
        setProfileValid(files.length > 0);
        if(files.length === 0) return;

        const reader = new FileReader();
        reader.addEventListener("load", ()=>{
            setProfile(reader.result);
        });
        reader.readAsDataURL(files[0]);

        //const previewUrl = URL.createObjectURL(files[0]);
        //setPreviewBlob(previewUrl);
    }, [profile]);
    const startTalk = useCallback(()=>{
        //saveNickname();
        navigate("/talk");
    }, [nickname, profile]);

    const checkNicknameUsing = useCallback(async (value)=>{
        const resp = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/nickname/${value}`);
        setNicknameUsing(resp.data);
    }, []);

    const saveNickname = useCallback(async ()=>{
        const resp = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/nickname/${nickname}`);
    }, [nickname]);

    //debounce
    const checkNickname = useCallback(debounce((value)=>{
        const regex = /^[ㄱ-ㅎㅏ-ㅣ가-힣0-9A-Za-z]+$/;
        const valid = regex.test(value);
        setNicknameValid(valid);        
        
        if(valid === true) {
            checkNicknameUsing(value);
        }
    }, 500), []);

    //view
    return (
        <div className="cocoa-container">
            <div className="container-fluid">
                <div className="row mt-5">
                    <div className="col-sm-8 offset-sm-2 text-dark">

                        {/* 제목 */}
                        <div className="row mt-4">
                            <div className="col d-flex justify-content-center align-items-center">
                                <span className="fs-1 fw-bolder me-4">CocoaTALK</span>
                                <img src={CocoaImage} width={50}/>
                            </div>
                        </div>

                        <hr/>

                        {/* 입력창 */}
                        <div className="row mt-4" style={{minHeight:250}}>
                            <div className="col">
                                {/* 닉네임 입력 */} 
                                <div className="row mt-4">
                                    <div className="col">
                                        <h3 className="fw-bold mb-3">닉네임을 설정하세요</h3>
                                        <input type="text" className={`form-control form-control-lg${nicknameUsing ? ' is-invalid text-danger' : ''}${nicknameValid && !nicknameUsing ? ' is-valid text-success' : ''}}`} 
                                                placeholder="사용할 닉네임 입력"
                                                value={nickname} onChange={e=>setNickname(e.target.value)}/>
                                        <div className="invalid-feedback fs-5">이미 사용중인 닉네임입니다</div>
                                    </div>
                                </div>

                                {/* 프로필 선택 */}
                                {nicknameValid && !nicknameUsing && (
                                <div className="row mt-4">
                                    <div className="col">
                                        <h3 className="fw-bold mb-3">프로필 사진을 설정하세요</h3>
                                        <label className="profile-selector d-flex justify-content-center align-items-center"
                                            style={{backgroundImage:`url(${previewBlob})`}}>
                                            {profile === null && (<span className="fs-2 fw-bold">클릭</span>)}
                                            <input type="file" className="form-control form-control-lg d-none" onChange={chooseProfile}></input>
                                        </label>
                                    </div>
                                </div>
                                )}

                                {(nicknameValid && profileValid) && (
                                <div className="row mt-4">
                                    <div className="col">
                                        <button className="btn btn-dark btn-lg w-100"
                                                onClick={startTalk}>시작하기</button>
                                    </div>
                                </div>
                                )}

                            </div>
                        </div>

                        <hr/>

                        {/* 안내사항 */}
                        <div className="row mt-4">
                            <div className="col text-dark">
                                <p>
                                    이 메신저는 웹소켓 수업을 위한 데모입니다
                                    <br/>
                                    상업적으로 이용하지 않으며 개인 정보를 보관하지 않습니다
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div> 
    );
};

export default Welcome;