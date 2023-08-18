import './styles/layout.css'

import React from 'react'
import axios from 'axios';
import { useNavigate, Outlet } from "react-router-dom";

var navigate
function MainLayout(){
    navigate = useNavigate();
    const [basic_details, setbasic_details] = React.useState()

    React.useEffect(()=>{
        axios.get("/api/basic_user_info", {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{setbasic_details(res.basic_details)}
		}).catch(error=>console.log("error:", error))
    }, [])

    function logout(e){
        e.preventDefault()
        axios.get(
			"/api/logout", 
			{withCredentials: true}
		).then(res=>res.data).then(res=>{
			navigate(res.logged_in ? '/home' : '/login')
		}).catch(error=>console.log("error:", error))
    }
    
    return (
      <>
        <div className='main-container'>
            <header>
                <div className='dropdown-menu'>
                    <div className='hbar-container'><div className='hbar'/><div className='hbar'/><div className='hbar'/></div>
                    <div className='dropdown-content'> 
                        <div className='dropdown-item' onClick={_=>navigate('/home')}>Home</div>
                        <div className='dropdown-item' onClick={_=>navigate('/home/registration')}>Course registration</div>
                        <div className='dropdown-item' onClick={_=>navigate('/courses/running')}>Running courses</div>
                        <div className='dropdown-item' onClick={logout}>Logout</div>
                    </div>
                </div>
                <div className='page-title'></div>
                {basic_details ? 
                    <div>
                        {basic_details.id}, {basic_details.name}<br></br>
                        {basic_details.dept_name}
                    </div>
                : <div></div>}
            </header>
            
            <Outlet />
            
            {/* <Footer/> */}
        </div>
      </>
    );
  };

export default MainLayout;