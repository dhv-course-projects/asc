Add the following code into a file ./backend/config.js (this is a lazy alternative to using environment variables)
```
config = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'enter_your_db_name_here',
    password: 'enter_your_password_here',
    port: 5432,
}

exports.postgres_client_config = config
```

Start the backend
```
cd backend
npm install
npm start
```
Start the frontend (separate terminal instance)
```
cd frontend
npm install
npm start
```

Note that the provided database does not have any record of a web-user but will want a student to login with the same id that it has registered in the database. 
So the gimmick is that instead of a separate signup page, the first time a user-id recognized by the database (try 93004 for example) tries to login, the provided password is remembered and checked against from then on.

# TO-DO:
Some of these might be very small tasks but for the sake of completeness I have noted them here.
* ~For instructor info seperate courses into running_sem or not and also for same year, sem sort courses by lexicographic order.~
* ~For /course/running/ only departments with running courses must be shown and  /course/running/:dept_name/ only running courses must be shown~
* ~Provide authorization for instructors to access information of students in the backend endpoint~
* ~Provide an endpoint for 'List of all courses' (point c)~
* ~Figure out sorting semesters and if the data can have reg_dates > current_date then modify running_sem evaluation~