const electron = require('electron')
var rest = require('restler');
const express = require('express');
var cors = require('cors')
var serveStatic = require('serve-static')
var io = require('socket.io-client')
var randomItem = require('random-item');
var serargs=[];
var socargs='';
var gloargs='';
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
var port = new SerialPort('/dev',{ baudRate: 9600});

const { app, BrowserWindow, ipcMain } = require('electron')
require('electron-reload')(__dirname);
var static = express();
static.use(cors())
static.use(serveStatic('routes', {'dash': ['index.html'],'propulsion':['index.html']}))
static.listen(3000)

//static.listen(6666);
var socket = io('');
app.on('ready', createWindow)



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 1500, height: 900 , resizable: false, fullscreenable: false, title: 'MDX Ground'})

  // and load the index.html of the app.
  win.loadURL('http://localhost:3000/dash')

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}



// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

ipcMain.on('ping', (event,args) => {
console.log("Received: "+args);
});
ipcMain.on('httpget', (event,args) => {

  rest.get(args).on('complete', function(result) {
    if (result instanceof Error) {
      console.log('Error:', result.message);
        event.returnValue ="failed";
     // this.retry(5000); // try again after 5 sec
    } else {
      event.returnValue = result;
      console.log(result);
    }
  });
  
});
ipcMain.on('connect', (event,args) => {
   socargs = args;
   socket = io('http://'+args);
   console.log("attempt")
   event.returnValue = "Ok";
socket.on('connect', function(){
  win.webContents.send('connected','Gateway Connected');
  gloargs = 'GATEWAY';
  console.log('in')
  });

  socket.on('connect_timeout', (timeout) => {
    console.log('timeout')
    win.webContents.send('disconnected','Connection Timed Out');
  });


  socket.on('connect_error', (timeout) => {
    win.webContents.send('disconnected','Error could not connect');
    socket.close();
    gloargs = '';
  });
  
  socket.on('disconnect', function(){
    win.webContents.send('disconnected','Gateway disconnected');
    socket.close();
    gloargs = '';
    console.log('out')
  });
   var upt = new Date();
   socket.on('data',function(data){
   // var payload = {};
  var utime = new Date() - upt;
  var  timenn = new Date(utime).getMilliseconds();
  console.log("Average Update:  "+timenn);
  upt=new Date();

    payload = JSON.parse(data);
  
    var payloadJson = JSON.stringify(payload);
    //console.log(payloadJson);
    win.webContents.send('data',payloadJson);
//    win.webContents.send('data',data);
   })
  
});

ipcMain.on('disconnect', (event,args) => {
try{
socket.close();
gloargs='';
event.returnValue = "Ok";
}
catch(error){

}
})

var dc = 0;
ipcMain.on('serialconnect', (event,arg) =>{

 serargs = arg.split(':')
 
event.returnValue="OK";
//const Readline = new Readline();
 port = new SerialPort(serargs[0],{ baudRate: parseInt(serargs[1]) });
parser = port.pipe(new Readline({ delimiter: '#' }));

port.on("open", () => {
  //console.log('serial port open');
  gloargs = 'SERIAL';
 
  win.webContents.send('connected','Device Connected');
});
parser.on('data', (line) =>{
  //line = line.toString();
var dnt = false;
//console.log(line);
var payload = {};
try{
  dc++;
  console.log(dc);
  payload = JSON.parse(line.toString());
  var payloadJson = JSON.stringify(payload);
 
}
 catch(err){
   console.error(err)
   dnt =true;
 }
 
if(!dnt){
  win.webContents.send('data',line.toString());
}
 
 //JSON.stringify(line);
  
  //var payloadJson = JSON.stringify(line);
  //console.log(line.navmode);

 //win.webContents.send('data',payloadJson);
});

port.on('error', function(err) {
 console.log('Error: ', err.message);
 gloargs = '';
 
  win.webContents.send('disconnected',err.message);
})
port.on('disconnect', function() {
 // console.log('Error: ', err.message);
 gloargs = '';
  win.webContents.send('disconnected','Device Connection Lost');
})
port.on('close', function(err) {
  //console.log('Error: ', err.message);
  gloargs = '';
  win.webContents.send('disconnected','Device Disconnected');
})
});
ipcMain.on('serialdisconnect', (event,args) => {
  try{
  port.close();
  gloargs = '';
  event.returnValue = "Ok";
  }
  catch(error){
  
  }
  })

  ipcMain.on('fetchports', (event,args) => {
    try{
      SerialPort.list(function(err,ports){
        console.log(ports)
        var portnames =[];
        for(var p of ports){
          portnames.push(p['comName'])
        }
        event.returnValue =  randomItem(portnames);
        });
    
    }
    catch(error){
    
    }
    })
  
     ipcMain.on('getState', (event,args) =>{
        if(gloargs==''){
          event.returnValue = 'null';
        }
        else if(gloargs=='SERIAL'){
          event.returnValue =  serargs[0]+','+serargs[1];
        }
        else if(gloargs=='GATEWAY'){
          event.returnValue = 'socket'+','+socargs
        }

     });