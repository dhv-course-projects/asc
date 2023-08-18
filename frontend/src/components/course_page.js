import './styles/course_page.css';

import React from 'react'
import axios from 'axios';
import { useNavigate , useParams } from "react-router-dom";

const util_dict = {
    'M':'Monday',
    'T':'Tuesday',
    'W':'Wednesday',
    'R':'Thursday',
    'F':'Friday',
}

function time_string(arr){  // ['M',8,0,8,30] => Monday: 08:00 to 08:30
    arr = arr.map((item,i)=>(i===0 || item>=10 ? item: '0'+item))
    return `${util_dict[arr[0]]} : ${arr[1]}:${arr[2]} to ${arr[3]}:${arr[4]}`
}

var navigate

function CoursePage() {
    navigate = useNavigate();

    const [course_details, setcourse_details] = React.useState()
    const [selected_sem_idx, setselected_sem_idx] = React.useState()

    const { course_id } = useParams()

    React.useEffect(()=>{
        axios.post("/api/course_info", {'course_id': course_id}, {withCredentials: true}).then(res=>res.data).then(res=>{
			if(!res.logged_in){navigate('/login')}
            else{
                setcourse_details(res.course_details)
                setselected_sem_idx(0)
                for(let i=0; i<res.course_details.sem_dependent_info.length; i++){
                    let sem = res.course_details.sem_dependent_info[i]
                    if(sem.semester === res.running_sem.semester && sem.year === String(res.running_sem.year)){
                        setselected_sem_idx(i)
                        break;
                    }
                }
            }
		}).catch(error=>console.log("error:", error))
    }, [course_id])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = (course_details ? course_details.title : "")
    }, [course_details])

    return (
        <>
            {course_details ? 
                <div>
                    <div className='course-info-main'>
                        <table className='course-info-basic'><tbody>
                            <tr><td>CourseID</td><td>{course_details.course_id}</td></tr>
                            <tr><td>Title</td><td>{course_details.title}</td></tr>
                            <tr><td>Credits</td><td>{course_details.credits}</td></tr>
                        </tbody></table>
                        {course_details.prereqs.length ? <div className='course-prereq-container'>
                            <div className='table-header'>Pre-requisites for this course:</div>
                            <table className='prereqs'><tbody>
                                <tr><th>Course ID</th><th>Title</th></tr>
                                {course_details.prereqs.map((prereq,i)=>{return(
                                    <tr key={i} onClick={_=>navigate('/courses/'+prereq.prereq_id)}>
                                        <td>{prereq.prereq_id}</td>
                                        <td>{prereq.prereq_title}</td>
                                    </tr>
                                )})}
                            </tbody></table>
                        </div> : <></>}
                    </div>
                    
                    {course_details.sem_dependent_info.length ? 
                        <><div className='table-header'>
                            Course information for semester: 
                            <select onChange={e=>setselected_sem_idx(e.target.value)} defaultValue={selected_sem_idx}>
                                {course_details.sem_dependent_info.map((sem,i)=>{return(
                                    <option key={i} value={i}>{sem.semester} {sem.year}</option>
                                )})}
                            </select></div>
                        <table className='section-list'><tbody>
                            <tr><th>Section</th><th>Instructor</th><th>Venue</th><th>Timings</th></tr>
                            {course_details.sem_dependent_info[selected_sem_idx].json_agg.map((sem,i)=>{return(
                                <tr key={i}>
                                    <td>S{sem.sec_id}</td>
                                    <td onClick={_=>navigate('/instructor/'+sem.instructor_id)}>{sem.instructor_name}</td>
                                    <td>#{sem.room_number}, {sem.building}</td>
                                    <td style={{whiteSpace:'pre'}}>{sem.timings ? 
                                        sem.timings.map((time_slot,i)=>time_string(time_slot)).join('\n')
                                    : ''}</td>
                                </tr>
                            )})}
                        </tbody></table></>
                    : <></>}
                </div>
            : <></>}
        </>
    );
}


export default CoursePage;