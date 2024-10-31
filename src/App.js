import logo from './logo.svg';
import './App.css';
import {useTitle} from "react-use";
import { Route, Routes } from "react-router";
import Welcome from "./components/Welcome";
import Talk from "./components/Talk";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { nicknameState, profileState, loadStorageState } from "@src/utils/recoil";

const App = ()=>{
  useTitle("CocoaTALK");

  const [nickname, setNickname] = useRecoilState(nicknameState);
  const [profile, setProfile] = useRecoilState(profileState);
  const [loadStorage, setLoadStorage] = useRecoilState(loadStorageState);

  return (<>
    <Routes>
      <Route path="/" element={<Welcome/>}></Route>
      <Route path="/talk" element={<Talk/>}></Route>
    </Routes>
  </>);
};

export default App;
