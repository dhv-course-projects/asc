import './styles/dept_courses.css';

import React from 'react'
import axios from 'axios';
import { useNavigate , useParams } from "react-router-dom";

var navigate

function DeptCourses() {
    navigate = useNavigate();

    const [running_course_list, setrunning_course_list] = React.useState()
    const [course_list, setcourse_list] = React.useState()

    const { dept_name } = useParams()

    React.useEffect(()=>{
        axios.post("/api/dept_courses", {'dept_name': dept_name}, {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{
                setcourse_list(res.course_list)
                setrunning_course_list(res.running_course_list)
            }
		}).catch(error=>console.log("error:", error))
    }, [dept_name])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = `${dept_name}`
    },[dept_name])

    return (
        <>  
            <div className='table-header'>Courses offered in this semester</div>
            <table className='dept-courses'><tbody>
            <tr><th>CourseID</th><th>Title</th><th>Credits</th></tr>    
            {running_course_list ? 
                running_course_list.map((course,i)=>{return(
                    <tr key={i} onClick={_=>navigate('/courses/'+course.course_id)}>
                        <td>{course.course_id}</td>
                        <td>{course.title}</td>
                        <td>{course.credits}</td>
                    </tr>
                )})
            : <></>}
            </tbody></table>

            <div className='table-header'>All Courses</div>
            <table className='dept-courses'><tbody>
            <tr><th>CourseID</th><th>Title</th><th>Credits</th></tr>    
            {course_list ? 
                course_list.map((course,i)=>{return(
                    <tr key={i} onClick={_=>navigate('/courses/'+course.course_id)}>
                        <td>{course.course_id}</td>
                        <td>{course.title}</td>
                        <td>{course.credits}</td>
                    </tr>
                )})
            : <></>}
            </tbody></table>
        </>
    );
}


export default DeptCourses;