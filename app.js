const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io')
const port = 3000;
//const helper = require('./utils/helper');
const model = require('./utils/model');
const cosrs = require('cors');
const { pool } = require('./utils/model');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':'false'}));
app.use(cosrs());

    const server = app.listen(port, () => {
        console.log("Server started on port " + port + "...");
    });
    const io = socket.listen(server);
    io.on('connection', async (socket) => {
          console.log(socket.handshake.query)
         let userId = socket.request._query['userId'];        
            let userSocketId = socket.id;     
             const response = await model.addSocketId( userId, userSocketId);
            
            if(!response ||  response === null){
                console.error(`Socket connection failed, for  user Id ${userId}.`);
            }
            
        /**
        * get the user's Chat list
        */
        // socket.on('chat-list', async (userId) => {

        //    let chatListResponse = {};   
           
        //     if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

        //         chatListResponse.error = true;
        //         chatListResponse.message = `User does not exits.`;
                
        //         io.emit('chat-list-response',chatListResponse);
        //     }else{
        //         const result = await model.getChatList(userId, socket.id);
        //         io.to(socket.id).emit('chat-list-response', {
        //             error: result !== null ? false : true,
        //             singleUser: false,
        //             chatList: result.chatlist
        //         });

        //         socket.broadcast.emit('chat-list-response', {
        //             error: result !== null ? false : true,
        //             singleUser: true,
        //             chatList: result.userinfo
        //         });
        //     }
        // });
        
        /**
        * send the messages to the user
        */
        // socket.on('add-message', async (data) => {
            
        //     if (data.message === '') {
                
        //         io.to(socket.id).emit(`add-message-response`,`Message cant be empty`); 

        //     }else if(data.fromUserId === ''){
                
        //         io.to(socket.id).emit(`add-message-response`,`Unexpected error, Login again.`); 

        //     }else if(data.toUserId === ''){
                
        //         io.to(socket.id).emit(`add-message-response`,`Select a user to chat.`); 

        //     }else{                    
        //         let toSocketId = data.toSocketId;
        //         const sqlResult = await model.insertMessages({
        //             fromUserId: data.fromUserId,
        //             toUserId: data.toUserId,
        //             message: data.message
        //         });
        //         io.to(toSocketId).emit(`add-message-response`, data); 
        //     }               
        // });


        /**
        * Logout the user
        */
        // socket.on('logout', async () => {
        //     const isLoggedOut = await model.logoutUser(socket.id);
        //     io.to(socket.id).emit('logout-response',{
        //         error : false
        //     });
        //     socket.disconnect();
        // });


        /**
        * sending the disconnected user to all socket users. 
        */
        // socket.on('disconnect',async ()=>{
        //     const isLoggedOut = await model.logoutUser(socket.id);
        //     setTimeout(async ()=>{
        //         const isLoggedOut = await model.isUserLoggedOut(socket.id);
        //         if (isLoggedOut && isLoggedOut !== null) {
        //             socket.broadcast.emit('chat-list-response', {
        //                 error: false,
        //                 userDisconnected: true,
        //                 socketId: socket.id
        //             });
        //         }
        //     },1000);
        // });

    });

app.get('/', (req, res, next) => {
    res.send('Welcome to the express server...');
});

// app.post('/usernameCheck',async (request,response) =>{
//     const username = request.body.username;
//     if (username === "" || username === undefined || username === null) {
//         response.status(412).json({
//             error : true,
//             message : `username cant be empty.`
//         });
//     } else {
//         const data = await model.userNameCheck(username.toLowerCase());
//         if (data[0]['count'] > 0) {
//             response.status(401).json({
//                 error:true,
//                 message: 'This username is alreday taken.'
//             });
//         } else {
//             response.status(200).json({
//                 error:false,
//                 message: 'This username is available.'
//             });
//         }
//     }
// });		

app.post('/registerUser', async (request,response) => {     
    const registrationResponse = {}
    const data = {
        username : (request.body.username).toLowerCase(),
        password : request.body.password
    };			
    if(data.username === '') {
        registrationResponse.error = true;
        registrationResponse.message = `username cant be empty.`;
        response.status(412).json(registrationResponse);
    }else if(data.password === ''){				            
        registrationResponse.error = true;
        registrationResponse.message = `password cant be empty.`;
        response.status(412).json(registrationResponse);
    }else{	        	
        const result = await model.registerUser( data );
        if (result === 'User exists') {
            registrationResponse.error = true;
            registrationResponse.message = result;
            return response.status(200).json(registrationResponse)
        }
        if (result === null) {
            registrationResponse.error = true;
            registrationResponse.message = `User registration unsuccessful,try after some time.`;
            response.status(417).json(registrationResponse);
        } else {
            registrationResponse.error = false;
            registrationResponse.userId = result.insertId;
            registrationResponse.username = data.username;
            registrationResponse.message = `User registration successful.`;
            response.status(200).json(registrationResponse);
        }
    }
});

app.post('/login',async (request,response) =>{
    const loginResponse = {}
    const data = {
        username : (request.body.username).toLowerCase(),
        password : request.body.password
    };
    if(data.username === '' || data.username === null) {
        loginResponse.error = true;
        loginResponse.message = `username cant be empty.`;
        response.status(412).json(loginResponse);
    }else if(data.password === '' || data.password === null){				            
        loginResponse.error = true;
        loginResponse.message = `password cant be empty.`;
        response.status(412).json(loginResponse);
    }else{
        const result = await model.loginUser(data);
        if (result === null || result.length === 0) {
            loginResponse.error = true;
            loginResponse.message = `Invalid username and password combination.`;
            response.status(401).json(loginResponse);
        } else {
            loginResponse.error = false;
            loginResponse.userId = result[0].id;
            loginResponse.username = result[0].username;
            loginResponse.message = `User logged in.`;
            response.status(200).json(loginResponse);
        }
    }
});

app.post('/userSessionCheck', async (request,response) =>{
    const userId = request.body.userId;
    const sessionCheckResponse = {}			
    if (userId == '') {
        sessionCheckResponse.error = true;
        sessionCheckResponse.message = `User Id cant be empty.`;
        response.status(412).json(sessionCheckResponse);
    }else{
        const username = await model.userSessionCheck(userId);
        if (username === null || username === '') {
            sessionCheckResponse.error = true;
            sessionCheckResponse.message = `User is not logged in.`;
            response.status(401).json(sessionCheckResponse);
        }else{
            sessionCheckResponse.error = false;
            sessionCheckResponse.username = username;
            sessionCheckResponse.message = `User logged in.`;
            response.status(200).json(sessionCheckResponse);
        }
    }
});

app.post('/getMessages',async (request,response) => {
    const userId = request.body.userId;
    const toUserId = request.body.friendId;
    const messages = {}			
    if (userId === '') {
        messages.error = true;
        messages.message = `userId cant be empty.`;
        response.status(200).json(messages);
    }else{
        const result = await pool.getMessages( userId, toUserId);
        if (result ===  null) {
            messages.error = true;
            messages.message = `Internal Server error.`;
            response.status(500).json(messages);
        }else{
            messages.error = false;
            messages.messages = result;
            response.status(200).json(messages);
        }
    }
});