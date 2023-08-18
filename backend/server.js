const express = require('express');
const sessions = require('express-session');
const bcrypt = require('bcrypt');

const { postgres_client_config } = require('./config');
const { Client } = require('pg');

const client = new Client(postgres_client_config)
client.connect()

var app = express();
const PORT = 8000;
const SALTROUNDS = 10;

// Populates req.session
app.use(sessions({
    secret: "randomlygeneratedsecretkey",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000*60*60
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/login', async function(req, res){
    if(req.session.userid){
        res.send({logged_in: true})
    } else{ // req.body {userid: , userpass:}
        let id_in_database = client.query("select * from student where id=$1 limit 1;", [req.body.userid])
        let id_in_webusers = client.query("select * from user_password where id=$1 limit 1;", [req.body.userid])

        let output = await id_in_database
        if (!output.rows.length){
            let is_in_instructor_table = (await client.query("select * from instructor where id=$1 limit 1;", [req.body.userid])).rows.length
            // no frontend for instructors, also api assumes different ids for student and instructors is responsibility of database
            if(!is_in_instructor_table){return res.send({logged_in: false, errmsg:"invalid userid"})}
        }
        output = await id_in_webusers
        if (output.rows.length){
            bcrypt.compare(req.body.userpass, output.rows[0].hashed_password).then(match=>{
                let response = {logged_in: match}
                if(match){req.session.userid = req.body.userid}
                else{response.errmsg = "incorrect password for this userid"}
                res.send(response)
            })
        }
        else{
            bcrypt.hash(req.body.userpass, SALTROUNDS)
            .then(hash=>client.query("insert into user_password values ($1, $2);", [req.body.userid, hash]))
            .then(output=>{
                req.session.userid = req.body.userid
                res.send({logged_in: true})
            })
        }
    }
});

app.get('/api/logout', (req,res)=>{
    req.session.destroy()
    res.send({logged_in: false})
});

app.get('/api/basic_user_info', async (req,res)=>{
    if(!req.session.userid){
        return res.send({logged_in: false})
    }
    let basic_details = client.query(
        "select * from student where id=$1;", 
        [req.session.userid]
    )
    let response = {logged_in: true}
    response.basic_details = (await basic_details).rows[0]
    return res.send(response)
}); 

function get_current_sem(){
    return client.query(`
        select year, semester 
        from reg_dates 
        where start_time <= to_timestamp($1)
        order by start_time desc 
        limit 1;`,
        [Date.now()/1000]
    )
        .then(res=>res.rows)
        .then(res=>(res.length ? 
            {'year': res[0].year, 'semester': res[0].semester} : 
            {'year': 2005, 'semester': 'Fall'}
        ))
}

app.get('/api/user_info', async (req,res)=>{
    if(!req.session.userid){
        res.send({logged_in: false})
    }else{
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )
        
        let running_sem = await get_current_sem()
        // running_sem = {'year': 2009, 'semester': 'Fall'};

        let running_sem_course_details = client.query(`
            select semester, year, json_agg(json_build_array(course_id, title, sec_id, grade, credits)) 
            from takes natural join course 
            where id = $1 and year = $2 and semester = $3
            group by semester, year 
            order by year desc, semester asc;`,
            [req.session.userid, running_sem.year, running_sem.semester]
        )

        let course_details = client.query(`
            select semester, year, json_agg(json_build_array(course_id, title, sec_id, grade, credits)) 
            from takes natural join course 
            where id = $1 and not (year = $2 and semester = $3)
            group by semester, year 
            order by year desc, case when semester='Winter' then 1 
                                     when semester='Fall' then 2 
                                     when semester='Summer' then 3
                                     when semester='Spring' then 4 end;`,
            [req.session.userid, running_sem.year, running_sem.semester]
        )

        let response = {logged_in: true}
        response.basic_details = (await basic_details).rows[0]
        response.running_sem_course_details = (await running_sem_course_details).rows
        response.course_details = (await course_details).rows

        // console.log('running_sem_course_details: ', running_sem_course_details)
        // console.log('course_details: ', course_details)
        
        res.send(response)
    }
});

app.post('/api/student_info', async (req,res)=>{
    if(!req.session.userid){
        return res.send({logged_in: false})
    }
    if(req.session.userid != req.body.userid){
        if(!(await client.query(`
                select * from instructor where id=$1 limit 1`, 
                [req.session.userid]
            )).rowCount){
            return res.send("Not authorised")
        }
    }
    let basic_details = client.query(
        "select * from student where id=$1;", 
        [req.body.userid]
    )
    
    let running_sem = await get_current_sem()

    let running_sem_course_details = client.query(`
        select semester, year, json_agg(json_build_array(course_id, title, sec_id, grade, credits)) 
        from takes natural join course 
        where id = $1 and year = $2 and semester = $3
        group by semester, year 
        order by year desc, semester asc;`,
        [req.body.userid, running_sem.year, running_sem.semester]
    )

    let course_details = client.query(`
        select semester, year, json_agg(json_build_array(course_id, title, sec_id, grade, credits)) 
        from takes natural join course 
        where id = $1 and not (year = $2 and semester = $3)
        group by semester, year 
        order by year desc, case when semester='Winter' then 1 
                                 when semester='Fall' then 2 
                                 when semester='Summer' then 3
                                 when semester='Spring' then 4 end;`,
        [req.body.userid, running_sem.year, running_sem.semester]
    )

    let response = {logged_in: true}
    response.basic_details = (await basic_details).rows[0]
    response.running_sem_course_details = (await running_sem_course_details).rows
    response.course_details = (await course_details).rows
    
    res.send(response)
});

app.get('/api/dept_list', async (req,res)=>{
    if(!req.session.userid){
        res.send({logged_in: false})
    }else{
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )
        let dept_list = client.query("select dept_name,building from department order by dept_name;")
        let running_sem = await get_current_sem()
        let running_dept_list = client.query(`
            select dept_name, building 
            from (
                select dept_name 
                from (
                    select course_id 
                    from section 
                    where semester=$1 and year=$2
                ) X natural join course
            ) Y natural join department 
            order by dept_name;`,
            [running_sem.semester, running_sem.year]
        )
        let response = {logged_in: true}
        response.basic_details = (await basic_details).rows[0]
        response.dept_list = (await dept_list).rows
        response.running_dept_list = (await running_dept_list).rows
        res.send(response)
    }
}); 

app.post('/api/dept_courses', async (req,res)=>{
    if(!req.session.userid){
        res.send({logged_in: false})
    }else{
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )
        let course_list = client.query(
            "select course_id, title, credits from course where dept_name=$1;",
            [req.body.dept_name]
        )
        let running_sem = await get_current_sem()
        let running_course_list = client.query(
            `select course_id, title, credits 
            from (
                select * from course where dept_name=$1
            ) X natural join section 
            where semester=$2 and year=$3;`,
            [req.body.dept_name, running_sem.semester, running_sem.year]
        )
        let response = {logged_in: true}
        response.basic_details = (await basic_details).rows[0]
        response.course_list = (await course_list).rows
        response.running_course_list = (await running_course_list).rows
        res.send(response)
    }
}); 

app.get('/api/all_courses', async (req,res)=>{
    res.send((await client.query("select * from course;")).rows)
}); 

app.post('/api/course_info', async (req,res)=>{
    if(!req.session.userid){
        res.send({logged_in: false})
    }else{
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )
        let basic_course_info = client.query(
            "select course_id, title, credits from course where course_id=$1;",
            [req.body.course_id]
        )
        let prereqs = client.query(`
            select prereq_id, title as prereq_title 
            from (
                select prereq_id from prereq where course_id=$1
            ) A inner join course on A.prereq_id=course.course_id;`,
            [req.body.course_id]
        )
        let sem_dependent_info = client.query(`
            select semester, year, json_agg(json_build_object(
                'sec_id', sec_id, 
                'building', building, 
                'room_number', room_number, 
                'instructor_id', id, 'instructor_name', name,
                'timings', timings
            )) 
            from (
                select * 
                from (
                    select * from section where course_id=$1
                ) S full outer join (
                    select * from teaches where course_id=$1
                ) T using (sec_id, semester, year, course_id)
            ) X left outer join (
                select time_slot_id, json_agg(json_build_array(day, start_hr, start_min, end_hr, end_min)) as timings from time_slot group by time_slot_id
            ) Y using (time_slot_id) natural join instructor
            group by semester, year 
            order by year desc, case when semester='Winter' then 1 
                                     when semester='Fall' then 2 
                                     when semester='Summer' then 3
                                     when semester='Spring' then 4 end;`,
            [req.body.course_id]
        )

        let response = {logged_in: true, course_details:{}}
        response.basic_details = (await basic_details).rows[0]
        response.course_details = (await basic_course_info).rows[0]
        response.course_details.prereqs = (await prereqs).rows
        response.course_details.sem_dependent_info = (await sem_dependent_info).rows
        response.running_sem = await get_current_sem()
        res.send(response)
    }
}); 

app.post('/api/instructor_info', async (req,res)=>{
    if(!req.session.userid){
        res.send({logged_in: false})
    }else{
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )
        let instructor_info = client.query(
            "select id,name,dept_name from instructor where id=$1;",
            [req.body.instructor_id]
        )
        let running_sem = await get_current_sem()
        let running_sem_course_list = client.query(`
            select semester, year, json_agg(json_build_object(
                'course_id', course_id, 
                'course_title', title, 
                'sec_id', sec_id
            ) order by course_id) 
            from (
                select * 
                from teaches 
                where id=$1
            ) X natural join course 
            where semester=$2 and year=$3
            group by semester, year 
            order by year desc, semester asc;`,
            [req.body.instructor_id, running_sem.semester, running_sem.year]
        )
        let course_list = client.query(`
            select semester, year, json_agg(json_build_object(
                'course_id', course_id, 
                'course_title', title, 
                'sec_id', sec_id
            ) order by course_id) 
            from (
                select * 
                from teaches 
                where id=$1
            ) X natural join course 
            where not(semester=$2 and year=$3)
            group by semester, year 
            order by year desc, case when semester='Winter' then 1 
                                     when semester='Fall' then 2 
                                     when semester='Summer' then 3
                                     when semester='Spring' then 4 end;`,
            [req.body.instructor_id, running_sem.semester, running_sem.year]
        )
        let response = {logged_in: true}
        response.basic_details = (await basic_details).rows[0]
        response.instructor_info = (await instructor_info).rows[0]
        response.running_sem_course_list = (await running_sem_course_list).rows
        response.course_list = (await course_list).rows
        res.send(response)
    }
}); 

app.get('/api/course_search', async (req,res)=>{
    if (!req.session.userid) {
        res.send({logged_in: false})
    } else {
        let basic_details = client.query(
            "select * from student where id=$1;", 
            [req.session.userid]
        )

        let running_sem = await get_current_sem()
        // console.log('running sem: ', running_sem)

        let course_list = client.query(`
            select course_id, title, array_agg(sec_id) as sections
            from course natural join section
            where semester = $1 and year = $2
            group by course_id, title;`,
            [running_sem.semester, running_sem.year]
        )
        //  and course_id like '%$1%'

        let response = {logged_in: true}
        response.basic_details = (await basic_details).rows[0]
        // console.log((await course_list))
        response.course_list = (await course_list).rows
        res.send(response)
    }
});

app.post('/api/course_registration', async (req,res)=>{
    if (!req.session.userid) {
        res.send({logged_in: false})
    } else {
        let running_sem = await get_current_sem()

        let response = {logged_in: true}

        let previously_registered = await client.query(`
            select count(*)
            from takes
            where id = $1 and course_id = $2 and sec_id = $3 and semester = $4 and year = $5;`,
            [req.session.userid, req.body.course_id, req.body.sec_id, running_sem.semester, running_sem.year]
        )
        if (Number(previously_registered.rows[0].count) > 0) {
            response.success = false
            response.msg = 'Already registered!'
            // console.log('Already registered!', previously_registered)
            return res.send(response)
        }

        let prereq_met = await client.query(`
            select count(*) from
            ((select distinct prereq_id from prereq where course_id = $1)
            except
            (select distinct course_id from takes where id = $2)) as A;`,
            [req.body.course_id, req.session.userid]
        )
        if (Number(prereq_met.rows[0].count)) {
            response.success = false
            response.msg = 'Pre-requisites not met, Failed to register!'
            // console.log('Pre-requisites not met, Failed to register!', prereq_met)
            return res.send(response)
        }

        let slot_clash = await client.query(`
            select count(*)
            from (
                (select time_slot_id from section where course_id = $2 and sec_id = $3 and semester = $4 and year = $5)
                except
                (select distinct time_slot_id from takes natural join section where semester = $4 and year = $5 and id = $1)
                ) as A;`,
            [req.session.userid, req.body.course_id, req.body.sec_id, running_sem.semester, running_sem.year]
        )
        if (Number(slot_clash.rows[0].count) == 0) {
            response.success = false
            response.msg = 'Selected course has a slot clash, Failed to register!'
            return res.send(response)
        }

        await client.query(`
            insert into takes
            values($1, $2, $3, $4, $5, $6);`,
            [req.session.userid, req.body.course_id, req.body.sec_id, running_sem.semester, running_sem.year, null]
        )
        response.success = true
        response.msg = 'Succesfully registered!'
        return res.send(response)
    }
});

app.post('/api/course_drop', async (req,res)=>{
    if (!req.session.userid) {
        res.send({logged_in: false})
    } else {
        let running_sem = await get_current_sem()

        let response = {logged_in: true}

        await client.query(`
            delete from takes
            where id = $1 and course_id = $2 and sec_id = $3 and semester = $4 and year = $5;`,
            [req.session.userid, req.body.course_id, req.body.sec_id, running_sem.semester, running_sem.year]
        )
        response.success = true
        response.msg = 'Succesfully dropped'
        return res.send(response)
    }
});

app.listen(PORT, ()=>console.log("server listening on port "+PORT))