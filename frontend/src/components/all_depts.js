import './styles/all_depts.css';

import React from 'react'
import axios from 'axios';
import { useNavigate } from "react-router-dom";

var navigate

function AllDepts() {
    navigate = useNavigate();

    const [dept_list, setdept_list] = React.useState()
    const [running_dept_list, setrunning_dept_list] = React.useState()

    React.useEffect(()=>{
        axios.get("/api/dept_list", {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{
                setdept_list(res.dept_list)
                setrunning_dept_list(res.running_dept_list)
            }
		}).catch(error=>console.log("error:", error))
    }, [])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = "Running Courses"
    },[])

    return (
        <>
            <div className='table-header'>Departments offering courses this semester</div>
            <table className='dept-list'><tbody>
            <tr><th>Department Name</th><th>Building</th></tr>    
            {running_dept_list ? 
                running_dept_list.map((dept,i)=>{return(
                    <tr key={i}>
                        <td onClick={_=>navigate('/courses/running/'+dept.dept_name)}>{dept.dept_name}</td>
                        <td>{dept.building}</td>
                    </tr>
                )})
            : <></>}
            </tbody></table>

            <div className='table-header'>All departments</div>
            <table className='dept-list'><tbody>
            <tr><th>Department Name</th><th>Building</th></tr>    
            {dept_list ? 
                dept_list.map((dept,i)=>{return(
                    <tr key={i}>
                        <td onClick={_=>navigate('/courses/running/'+dept.dept_name)}>{dept.dept_name}</td>
                        <td>{dept.building}</td>
                    </tr>
                )})
            : <></>}
            </tbody></table>
        </>
    );
}


export default AllDepts;