import './styles/login.css';

import React from 'react'
import axios from 'axios'

import { useNavigate } from "react-router-dom";

var navigate

function Login() {
	navigate = useNavigate();

	React.useEffect(()=>{
		axios.post(
			"/api/login", 
			'', 
			{withCredentials: true}
		).then(res=>res.data).then(res=>{
			if(res.logged_in){navigate('/home')}
		}).catch(error=>console.log("error:", error))
	},[])

	const [errmsg, setMsg] = React.useState('')

	function login(e){
		e.preventDefault();
		let formData = new FormData(document.querySelector("#login-form"))
		axios.post(
			"/api/login", 
			Object.fromEntries(formData), 
			{withCredentials: true}
		).then(res=>res.data).then(res=>{
			navigate(res.logged_in ? '/home' : '/login')
			if(res.errmsg){setMsg(res.errmsg)}
		}).catch(error=>console.log("error:", error))
	}

	return (
		<div className="login-main-container flex-center">
			<form onSubmit={e=>login(e)} className="card flex-center" id="login-form" encType="multipart/form-data">
				<div className="form-row">
					<label htmlFor="userid">User-ID</label>
					<input type="text" id="userid" name="userid" placeholder="enter student-ID"></input>
				</div>
				<div className="form-row">
					<label htmlFor="userpass">Password</label>
					<input type="password" id="userpass" name="userpass" placeholder="enter password"></input>
				</div>
				<input className="button" type="submit" value="Login"></input>
				<div className='errmsg'>{errmsg}</div>
			</form>
		</div>
	);
}

export default Login;
