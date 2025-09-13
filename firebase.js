
import { initializeApp } from "firebase/app";
import { getAuth ,createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore,setDoc,doc } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDO1PA4TqkRj6AQZT8Tnz65sJwfmyPF3MI",
  authDomain: "careerpath-1b393.firebaseapp.com",
  projectId: "careerpath-1b393",
  storageBucket: "careerpath-1b393.firebasestorage.app",
  messagingSenderId: "473349400035",
  appId: "1:473349400035:web:39687837a33d536e25ecd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const SignUp=document.getElementById('submit');
SignUp.addEventListener('click',(event)=>{
    event.preventDefault();
    const email=document.getElementById('regemail').value;
    const password=document.getElementById('regpassword').value;
    const firstName=document.getElementById('fname').value
    const lastName=document.getElementById('lname').value;
    const AreaCode=document.getElementById('areacode').value;
    const phoneNo=document.getElementById('phone').value;
    const role=document.getElementById('role').value;
    const StudClass=document.getElementById('studentClass').value;
    const location=document.getElementById('location').value;

    const auth= getAuth();
    const db=getFirestore()
})

//  export {app,auth};