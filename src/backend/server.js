const express = require('express')
const app = express()
const path = require('path');
const fileUpload = require('express-fileupload');
const PORT = 3000



// app.get('/form' , function(req, res) {
//     app.use(express.static(__dirname + '/form.html'));
//     app.use('/form', fileUpload() )

// })  


// default options
//app.use(fileUpload());

//express.static('/', )

// app.get('/', function(req, res) {
// res.render('../../dist/index');

// //app.use(express.static('../../dist'));

// })

app.get('/ping', function(req, res) {
    res.send('pong');
  });



  app.post('/upload', function(req, res) {
    let fileUpload;
    let uploadPath;
  
    if (Object.keys(req.files).length == 0) {
      res.status(400).send('No files were uploaded.');
      return;
    }
    console.log('req.files >>>', req.files);
    sampleFile = req.files.sampleFile;

    uploadPath = __dirname + '/uploads/' + sampleFile.name;
  
    sampleFile.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
  
      res.send('File uploaded to ' + uploadPath);
    })

})

app.get('/form', function(req, res){
    res.sendFile(__dirname + '/form.html');
    app.use(fileUpload());
})

app.get('/', function(req, res){
    const p = path.resolve(__dirname + '../../../dist/index.html')
    console.log(p);
    res.sendFile(p);
})
app.use('/', express.static(path.resolve(__dirname + '../../../dist/')));

//app.post('/vid')

function start(){
    app.listen(PORT, function() {
        console.log('Express server listening on port ', PORT); // eslint-disable-line
      }); 
}
app.listen(PORT, function() {
    console.log('Express server listening on port ', PORT); // eslint-disable-line
  });
start();
