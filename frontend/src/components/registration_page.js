import './styles/registration_page.css';

import React from 'react'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

var navigate

function RegistrationPage() {
    navigate = useNavigate();

    const [course_list, setCourse_list] = React.useState() // All courses in the running semester
    const [display_course_list, setDisplay_course_list] = React.useState([]) // All courses to be displayed
    const [input_search_string, setInput_search_string] = React.useState('') // The string input in the search box
    const [selected_section, setSelected_section] = React.useState({}) // An object whose keys are course ids and 
        // values are the section selected in the dropdown

    React.useEffect(() => {
        axios.get("/api/course_search", {withCredentials: true}
        ).then(res => 
            res.data
        ).then(res => {
            if (!res.logged_in)
                navigate('/login')
            else {
                for (let i = 0; i < res.course_list.length; i++)
                    res.course_list[i].id = i;
                setCourse_list(res.course_list)
                setDisplay_course_list(res.course_list)
                change_selected_section_state(res.course_list)
            }
        })
    }, [])

    React.useEffect(()=>{
        document.querySelector('.page-title').innerHTML = "Course Registration"
    },[])

    function change_selected_section_state(display_courses_list) {
        // Note the parameter must be a normal list and not a state!
        // Else useEffect will ask to add the state in it's dependency list
        var section_map = {}
        for (var display_course of display_courses_list)
            section_map[display_course.course_id] = display_course.sections[0]
        setSelected_section(section_map)
    }

    const handleOnSearch = (string, results) => {
        console.log('handleOnSearch:', results)
        setInput_search_string(string)
        if (string.length)
            setDisplay_course_list(results)
        else
            setDisplay_course_list(course_list)
    }

    const handleOnSelect = (item) => {
        console.log(item)
        setDisplay_course_list([item])
    }

    const handleOnClear = () => {
        setDisplay_course_list(course_list)
    }

    const formatResult = (item) => {
        return (
          <>
            <span style={{ display: 'block', textAlign: 'left' }}>{item.course_id}, {item.title}</span>
          </>
        )
    }

    function register(e, i) {
        e.preventDefault()
        console.log('The course to register is: ', display_course_list[i].course_id, ' with section: ', selected_section[display_course_list[i].course_id])
        if (selected_section === 0) {
            // Also use red background for the message
            toast.error('Select section!')
        } else {
            // do something
            // Msg popup
            // Clear searchbox and the selected course table
            setInput_search_string('')
            setDisplay_course_list(course_list)
            // console.log("Before course_registration", {'course_id': display_course.course_id, 'sec_id': selected_section})
            axios.post("/api/course_registration", {'course_id': display_course_list[i].course_id, 'sec_id': selected_section[display_course_list[i].course_id]}, {withCredentials: true}
            ).then(res => 
                res.data
            ).then(res => {
                if (!res.logged_in)
                    navigate('/login')
                else {
                    // setbasic_details(res.basic_details)
                    // for (let i = 0; i < res.course_list.length; i++)
                    //     res.course_list[i].id = i;
                    // setCourse_list(res.course_list)
                    console.log(res)
                    console.log('Registration reply: ', res.msg)
                    if (res.success)
                        toast.success(res.msg)
                    else
                        toast.error(res.msg)
                    // alert(res.msg)
                }
            })
        }
    }

    return (
        <>
            <ToastContainer 
                autoClose={3000}
            />
            <div className='search-box'>
                <ReactSearchAutocomplete
                    items={course_list}
                    onSearch={handleOnSearch}
                    onSelect={handleOnSelect}
                    onClear={handleOnClear}
                    formatResult={formatResult}
                    showIcon={true}
                    fuseOptions={{ keys: ["course_id", "title"] }}
                    resultStringKeyName="course_id"
                    inputSearchString={input_search_string}
                    styling={{borderRadius: '10px'}}
                />
            </div>
            {display_course_list.length ?
                <table className='course-reg'><tbody>
                    <tr>
                        <th>Course Code</th><th>Course Name</th><th>Section</th><th>Register</th>
                    </tr>
                    {display_course_list.map((display_course, i) => {
                        return (
                            <tr key={i}>
                                <td>{display_course.course_id}</td>
                                <td onClick={_=>navigate('/courses/'+display_course.course_id)}>{display_course.title}</td>
                                <td>
                                    <label>Choose Section</label>
                                    <select style={{'width': '100px', 'height' : '50px'}} onChange={e => setSelected_section(previousState => {
                                        return {...previousState, [display_course.course_id]: e.target.value}
                                    })}>
                                        {display_course.sections.map((section_id, i) => {
                                            return (
                                                <option key={i}>{section_id}</option>
                                            )
                                        })}
                                    </select>
                                </td>
                                <td>
                                    <input type="button" value="Register" onClick={e => register(e, i)}/>
                                </td>
                            </tr>
                        )
                    })}
                </tbody></table>
            : <></>}
        </>
    )
}

export default RegistrationPage;