import './styles/instructor_page.css';

import React from 'react'
import axios from 'axios';
import { useNavigate , useParams } from "react-router-dom";

var navigate

function InstructorPage() {
    navigate = useNavigate();

    const [instructor_info, setinstructor_info] = React.useState()
    const [running_sem_course_list, setrunning_sem_course_list] = React.useState()
    const [course_list, setcourse_list] = React.useState()

    const { instructor_id } = useParams()

    React.useEffect(()=>{
        axios.post("/api/instructor_info", {'instructor_id': instructor_id}, {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{
                setinstructor_info(res.instructor_info)
                setrunning_sem_course_list(res.running_sem_course_list)
                setcourse_list(res.course_list)
            }
		}).catch(error=>console.log("error:", error))
    }, [instructor_id])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = (instructor_info ? instructor_info.name : '')
    }, [instructor_info])

    return (
        <>  
            {instructor_info ? 
                <table className='instructor-info-basic'><tbody>
                    <tr><td>InstructorID</td><td>{instructor_info.id}</td></tr>
                    <tr><td>Name</td><td>{instructor_info.name}</td></tr>
                    <tr><td>Department</td><td>{instructor_info.dept_name}</td></tr>
                </tbody></table>
            : <></>}

            {running_sem_course_list ? 
                <div><div className='table-header'>Courses being offered by {instructor_info.name}</div>
                <table className='instructor-courses'><tbody>
                
                <tr><th>Semester</th><th>CourseID</th><th>Title</th><th>Section</th></tr>    
                {running_sem_course_list.map((sem,i)=>{return(
                    sem.json_agg.map((course, i)=>{return(
                        <tr key={i}>
                            {i===0 ? 
                                <td rowSpan={sem.json_agg.length} className='table-header' style={{backgroundColor:'#3E439F55'}}>{sem.semester} {sem.year}</td>
                            : <></>}
                            <td>{course.course_id}</td>
                            <td onClick={_=>navigate('/courses/'+course.course_id)} className='clickable-link'>{course.course_title}</td>
                            <td>S{course.sec_id}</td>
                        </tr>
                    )})
                )})}
                </tbody></table> </div>
            : <></>}
            
            {course_list ? 
                <div><div className='table-header'>Courses offered by {instructor_info.name} in the past</div>
                <table className='instructor-courses'><tbody>
                
                <tr><th>Semester</th><th>CourseID</th><th>Title</th><th>Section</th></tr>    
                {course_list.map((sem,i)=>{return(
                    sem.json_agg.map((course, i)=>{return(
                        <tr key={i}>
                            {i===0 ? 
                                <td rowSpan={sem.json_agg.length} className='table-header' style={{backgroundColor:'#3E439F55'}}>{sem.semester} {sem.year}</td>
                            : <></>}
                            <td>{course.course_id}</td>
                            <td onClick={_=>navigate('/courses/'+course.course_id)} className='clickable-link'>{course.course_title}</td>
                            <td>S{course.sec_id}</td>
                        </tr>
                    )})
                )})}
                </tbody></table> </div>
            : <></>}
        </>
    );
}


export default InstructorPage;