import './styles/home.css';

import React from 'react'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

var navigate

function Home() {
    navigate = useNavigate();
    
    const [basic_details, setbasic_details] = React.useState()
    const [courses, setCourses] = React.useState()
    const [running_courses, setRunning_Courses] = React.useState([])
    const [reload, setReload] = React.useState(false)

    React.useEffect(()=>{
        axios.get("/api/user_info", {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{
                setbasic_details(res.basic_details)
                setCourses(res.course_details)
                setRunning_Courses(res.running_sem_course_details)
            }
		}).catch(error=>console.log("error:", error))
    }, [reload])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = "Home"
    },[])

    function drop(e, i) {
        e.preventDefault()
        // console.log(running_courses[0]['json_agg'][i], ' and i: ', i)
        // console.log('Selected course: ', running_courses[0]['json_agg'][i][0], ' and section: ', running_courses[0]['json_agg'][i][2], ' to drop')
        // alert('Selected course: ' + running_courses[0]['json_agg'][i][0] + ' and section: ' + running_courses[0]['json_agg'][i][2], ' to drop')
        // console.log('Reload the component!')
        // setReload(!reload)
        axios.post(
			"/api/course_drop", 
            {'course_id': running_courses[0]['json_agg'][i][0], 'sec_id': running_courses[0]['json_agg'][i][2]},
			{withCredentials: true}
		).then(res => 
            res.data
        ).then(res => {
            if (!res.logged_in)
                navigate('/login')
            else {
                console.log(res)
                console.log('Course Drop reply: ', res.msg)
                if (res.success)
                    toast.success(res.msg)
                else
                    toast.error(res.msg)
                setReload(!reload)
            }
        })
    }

    return (
        <>
            <ToastContainer 
                autoClose={3000}
            />
            <div style={{textAlign: 'right', margin:'35px 35px 0px 0px'}}>Total credits: {basic_details ? basic_details.tot_cred : '(loading..)'}</div>
            
            {/* {courses ? 
                <table className='course-by-semester2'><tbody>
                    <tr><th>Semester</th><th>CourseID</th><th>Title</th><th>Section</th><th>Grade</th><th>Credits</th></tr>    
                    {courses.map((sem,i)=>{return(
                        sem.json_agg.map((row,i)=>{return(
                            <tr key={i}>
                                {i===0 ? 
                                    <td rowSpan={sem.json_agg.length} className='table-header' style={{backgroundColor:'#3E439F55'}}>{sem.semester} {sem.year}</td>
                                : <></>}
                                {row.map((val,i)=>{return(
                                    <td key={i}>{val}</td>
                                )})}
                            </tr>
                        )})
                    )})}
                </tbody></table>
            : <></>} */}

            {running_courses.length ? 
                running_courses.map((sem,i)=>{return(
                    <div key={i}><div className='table-header'>Running Semester {sem.semester} {sem.year}</div>
                    <table key={i} className='course-by-semester'><tbody key={i}>
                    <tr><th>CourseID</th><th>Title</th><th>Section</th><th>Grade</th><th>Credits</th><th>Drop</th></tr>
                    
                    {sem.json_agg.map((row,i)=>{return(
                    <tr key={i}>
                        {row.map((val,i)=>{return(
                            i===1 ? 
                            <td onClick={_=>navigate('/courses/'+row[0])} key={i}>{val}</td>:
                            <td key={i}>{val}</td>
                        )})}
                        <td><input type="button" value="Drop" id="i" onClick={e => drop(e, i)}/></td>
                    </tr>
                    )})}
                    </tbody></table> </div>
                )})
            : <></>}
            
            {courses ? 
                courses.map((sem,i)=>{return(
                    <div key={i}><div className='table-header'>{sem.semester} {sem.year}</div>
                    <table key={i} className='course-by-semester'><tbody key={i}>
                    <tr><th>CourseID</th><th>Title</th><th>Section</th><th>Grade</th><th>Credits</th></tr>    
                    
                    {sem.json_agg.map((row,i)=>{return(
                    <tr key={i}>
                        {row.map((val,i)=>{return(
                            i===1 ? 
                            <td onClick={_=>navigate('/courses/'+row[0])} key={i}>{val}</td>:
                            <td key={i}>{val}</td>
                        )})}
                    </tr>
                    )})}
                    </tbody></table> </div>
                )})
            : <></>}
        </>
    );
}


export default Home;
