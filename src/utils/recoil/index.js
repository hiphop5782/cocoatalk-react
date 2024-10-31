import { recoilPersist } from "recoil-persist";
import {atom, selector} from "recoil";

const { persistAtom } = recoilPersist();

const nicknameState = atom({
    key:"nicknameState",
    default:'',
    effects_UNSTABLE:[persistAtom]
});
export {nicknameState};

const profileState = atom({
    key:"profileState",
    default:'',
    effects_UNSTABLE:[persistAtom]
});
export {profileState};

const loadStorageState = atom({
    key:"loadStorageState", 
    default:false,
    effects_UNSTABLE:[persistAtom]
});
export {loadStorageState};

const memberLoginState = selector({
    key:"memberLoginState",
    get:(state)=>{
        const nickname = state.get(nicknameState);
        return nickname.length > 0;
    },
});
export {memberLoginState}