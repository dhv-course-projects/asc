import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from './components/layout'
import Login from './components/login'
import Home from './components/home'
import AllDepts from './components/all_depts.js'
import DeptCourses from './components/dept_courses.js'
import CoursePage from './components/course_page.js'
import InstructorPage from './components/instructor_page.js'
import RegistrationPage  from './components/registration_page.js'
import React from "react";



function App() {
  return (
    <>
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="login" element={<Login />} />
        
        <Route element={<MainLayout/>}>  
          <Route path="home">
            <Route index element={<Home />} />
            <Route path="registration" element={<RegistrationPage />} />
          </Route>
          
          <Route path="courses">
            <Route path=":course_id" element={<CoursePage />} />
          
            <Route path="running">
              <Route index element={<AllDepts />} />
              <Route path=":dept_name" element={<DeptCourses />} />
            </Route>
          
          </Route>
          
          <Route path="/instructor/:instructor_id" element={<InstructorPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App;
