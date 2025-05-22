# Reddit App

Collaborated with Jinwen Wu

Prerequisites:
1. Have Mongodb installed (https://www.mongodb.com/try/download/community)
2. Have Node.js installed (https://nodejs.org/en/download)
3. Create a folder at the path C:\data\db on your system. This directory will be used by MongoDB to store database files

Main Steps:
1. First do npm install inside the server directory and also do the same for the client directory.
2. Next start up the mongodb service with the command mongod.
3. Next run node init.js mongodb://127.0.0.1:27017/phreddit `<firstName>` `<lastName>` `<email>` `<username>` `<password>`. These inputs are for the admin user.
4. Afterwards start up the express server in the server directory with the command nodemon server.js.
5. Finally start the react client in the client directory with the command npm run start.


Testing:
1. First run mongod to start up the service.
2. Ensure that the phreddit database in mongodb has been dropped. 
3. Then in the outmost directory run npm run test.
4. After running the tests, make sure to initialize the database again by starting from step 3 in the main steps again when running the phreddit app.

