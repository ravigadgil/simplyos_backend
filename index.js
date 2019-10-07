const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const formidable = require('formidable');
const pdf = require('pdf-parse');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;

//Database
mongoose.connect('mongodb+srv://redus:redis06122002!@cluster0-xwsm9.mongodb.net/simplyopensource?retryWrites=true&w=majority');
let db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once('open', () => console.log('Connected to MongoDB'));

//Models
let Category = require('./models/Category');
let Test = require('./models/Test');

//API MiddleWares
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use('/pdf', express.static(__dirname + '/pathToPDF'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.json()).use(express.urlencoded())

//BodyParser MiddleWares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Get Categories
app.get('/categories', (req, res) => {
  Category.find({}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});

//Get All Tests
app.get('/tests', (req, res) => {
  const id = req.params.id;
  Test.find({}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});

//Get All Tests Of A Category
app.get('/tests/category/:id', (req, res) => {
  const id = req.params.id;
  Test.find({category_id: id}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});

//Get Test
app.get('/test/:id', (req, res) => {
  const id = req.params.id;
  Test.findOne({_id: id}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});

//Add Category
app.post('/category/add/:cat_name', (req, res) => {
  const category_name = req.params.cat_name;
  let category = new Category();
  category.name = category_name;
  category.save(err => {
    if(err) {
      console.log(err);
      res.json(err);
    } else {
      res.json('Added!');
    }
  })
})

//Save The PDF File To Server
app.post('/getPDf', (req, res) => {
  const form = new formidable.IncomingForm();
  try {
    form.parse(req, function (err, fields, files) {
      if(files.filetoupload != undefined) {
        var oldpath = files.filetoupload.path;
        var newpath = path.join(__dirname, files.filetoupload.name);
        fs.rename(oldpath, newpath, function (err) {
          if (err) 
            res.json('Error! Restart the server immediately!');
            res.json('File uploaded and moved!');
        })
      } else {
        req.json('File not found!')
      }
    });
  } catch(e) {
    res.json(e);
  }
});

app.get('/', (req, res) => {
  res.json({msg: __dirname});
})

//Upload The Test Questions And Answers To Database
app.post('/tests/add/:title/:pdfName/:cat_id', (req, res) => {
  const title = req.params.title;
  const pdfName = req.params.pdfName;
  const cat_id = req.params.cat_id;
  let dataBuffer = fs.readFileSync(`./${pdfName}.pdf`)
  pdf(dataBuffer).then(function(data) {
    //This split every question(wich starts from 1 because first is intro shit)
    const dataArray = data.text.split("QUESTION");
    const answers = [];
    const questions = [];
    for(let i = 1; i < dataArray.length; i++) {
      //This is every line of a question
      let myData = dataArray[i].split('\n');
      
      //Filter Headers And Footers
      myData = myData.filter(data => !data.includes('ActualTests.com') && !data.includes('Practice Exam') && !data.includes('Pass Any Exam. Any Time'))

      //This is the whole answer line
      let answerLine = '';
      myData.forEach(data => {
        if(data.includes('Answer: ')) {
          answerLine = data;
        }
      });

      //This is the answer
      const answer = answerLine.split(": ")[1];

      //This is the question lines without answer And alternatives
      let questionLines = myData.filter(line => !line.includes('Answer: ') && !line.includes('NO:'));
      let questionOutput = '';
      questionLines.forEach(question => {
        if(question == ' ') {
          question += '\n';
        } else {
          questionOutput += question;
        }
      })
      questions.push(questionOutput);
      answers.push(answer)
    }   
    let test = new Test();
    test.questions = questions;
    test.answers = answers;
    test.category_id = cat_id;
    test.title = title;
    test.save(err => {
      if(err) { 
        console.log(err);
        res.json({msg: err});
      } else {
        console.log("Added");
        res.json({msg: "Added"});
      }
    });
  });
})

app.listen(PORT, () => console.log("Server Started at port: " + PORT));
 