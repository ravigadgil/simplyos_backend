const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const app = express();
const formidable = require('formidable');
const pdf = require('pdf-parse');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;

//mongodb+srv://redus:redis06122002!@cluster0-xwsm9.mongodb.net/simplyopensource?retryWrites=true&w=majority

//Database
mongoose.connect('mongodb+srv://redus:redis06122002!@cluster0-xwsm9.mongodb.net/simplyopensource?retryWrites=true&w=majority');
let db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once('open', () => console.log('Connected to MongoDB'));

//Models
let Category = require('./models/Category');
let Test = require('./models/Test');
let User = require('./models/User');
let Comment = require('./models/Comment');
let Review = require('./models/Review');

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


//SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + ".pdf")
  }
})
 
var upload = multer({ storage: storage })

//Shuffle Array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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

//Upload The Test Questions And Answers To Database
app.post('/tests/add/:title/:pdfName/:cat_id', (req, res) => {
  const title = req.params.title;
  const footer = '"Pass Any Exam. Any Time." - www.actualtests.com';
  const header = 'Cisco 200-125 Exam';
  const pdfName = 'try6';
  const cat_id = req.params.cat_id;
  let dataBuffer = fs.readFileSync(`./${pdfName}.pdf`)
  pdf(dataBuffer).then(function(data) {
    //This split every question(wich starts from 1 because first is intro shit)
    const dataArray = data.text.split("QUESTION");
    shuffle(dataArray);
    const answers = [];
    const questions = [];
    for(let i = 1; i < dataArray.length; i++) {
      //This is every line of a question
      let myData = dataArray[i].split('Explanation:')[0];
      myData = myData.split('\n');
      
      //Filter Headers And Footers
      myData = myData.filter(data => !data.includes(header) && !data.includes('ActualTests.com') && !data.includes('Practice Exam') && !data.includes('Pass Any Exam. Any Time') &&
      !data.includes('Explanation:') && !data.includes(footer))

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
      let questionLines = myData.filter(line => !line.includes('Reference') && !line.includes('Answer: ') && !line.includes('NO:'));
      let questionOutput = '';
      questionLines.forEach(question => {
        if(question == ' ') {
          question += '\n';
        } else {
          questionOutput += question;
        }
      })
      questions.push(questionOutput);
      answers.push(answer);
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
});

app.get('/search/:query', (req, res) => {
  const query = req.params.query.toLocaleLowerCase();
  Test.find({}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      let filteredData = []
      data.forEach(test => {
        if(test.title.toLowerCase().indexOf(query) != -1) {
          filteredData.push(test);
        }
      });
      res.json(filteredData);
    }
  });
});

app.post('/upload', upload.single('avatar'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
    res.send(file)
});

app.post('/deleteCategory/:id', (req, res) => {
  Category.remove({_id: req.params.id}, (err) => {
    if(err)
      res.json(err);
    res.json({msg: "Deleted"});
  })
});

app.post('/deleteTest/:id', (req,res) => {
  Test.remove({_id: req.params.id}, (err) => {
    if(err)
      res.json(err);
    res.json({msg: "Deleted"});
  })
});

//Get Users
app.get('/users', (req, res) => {
  User.find({}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
});

//Add Users
app.post('/users/:username/:email/:pass/:certifications/:qualifications/:organization', (req, res) => {
  let user = new User();
  user.username = req.params.username;
  user.password = req.params.pass;
  user.tests = [];
  user.email = req.params.email;
  user.certifications = req.params.certifications;
  user.qualifications = req.params.qualifications;
  user.organization = req.params.organization;
  user.save(err => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: "Added"});
    }
  });
});

//Delete Users
app.post('/users/delete/:id', (req, res) => {
  User.remove({_id: req.params.id}, (err) => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: "Deleted"});
    }
  })
});

//Get Single User
app.get('/users/:username', (req, res) => {
  User.findOne({username: req.params.username}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
});

//Add Tests To The User
app.post('/users/addTest/:user/:test_id', (req, res) => {
  User.findOne({username: req.params.user}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      if(data.tests.includes(req.params.test_id)) {
        res.json({msg: "Updated"});
      } else {
        data.tests.unshift(req.params.test_id);
        User.update({username: req.params.user}, {tests: data.tests}, (err) => {
          if(err) {
            res.json(err);
          } else {
            res.json({msg: "Updated"});
          }
        })
      }
    }
  })
});

//Get Only Test Title
app.get('/users/title/:id', (req, res) => {
  Test.findOne({_id: req.params.id}, (err, data) => {
    if(err) 
      res.json(err);
    else
      res.json({title: data.title});
  });
});

//Update Profile
app.post('/users/update/:username/:certifications/:qualifications/:organization', (req, res) => {
  User.update({username: req.params.username}, {username: req.params.username, certifications: req.params.certifications,
    organization: req.params.organization, qualifications: req.params.qualifications}, (err) => {
      if(err) {
        res.json(err);
      } else {
        res.json({msg: "Updated"});
      }
    })
});

//Update Test Review
app.post('/tests/review/:review/:id/:user_id', (req, res) => {
  Test.findOne({_id: req.params.id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      Test.updateOne({_id: req.params.id}, {reviews_length: parseInt(data.reviews_length) + 1, reviews_sum: data.reviews_sum + parseInt(req.params.review)}, err => {
        if(err) {
          res.json(err);
        } else {
          User.findOne({_id: req.params.user_id}, (usererr, userdata) => {
            if(err) {
              res.json(usererr) 
            } else {
              userdata.reviews.push(req.params.id);
              User.updateOne({_id: req.params.user_id}, {reviews: userdata.reviews}, err => {
                if(err) {
                  res.json(err);
                } else {
                  let review = new Review();
                  review.review = parseInt(req.params.id);
                  review.user_id = req.params.user_id;
                  review.post_id = req.params.id;
                  review.save(err => {
                    if(err) {
                      res.json(err);
                    } else {
                      res.json({msg: "Updated"})
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
})

//Get Reviews Of A User
app.get('/reviews/user/:user_id', (req, res) => {
  Review.find({user_id: req.params.user_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else { 
      res.json(data);
    }
  })
});

//Get Reviews Of A User of a test
app.get('/reviews/user/:user_id/:test_id', (req, res) => {
  Review.findOne({user_id: req.params.user_id, post_id: req.params.test_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else { 
      res.json(data);
    }
  })
});


//Get All Comments
app.get('/comments', (req, res) => {
  Comment.find({}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Get all comments from a user
app.get('/comments/user/:user_id', (req, res) => {
  Comment.find({user_id: req.params.user_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Get all comments from a post
app.get('/comments/post/:post_id', (req, res) => {
  Comment.find({post_id: req.params.post_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Add Reviews As Comments
app.post('/comments/add/:comment/:user_id/:post_id', (req, res) => {
  let comment = new Comment();
  comment.comment = req.params.comment;
  comment.user_id = req.params.user_id;
  comment.post_id = req.params.post_id;
  comment.save(err => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: "Added"});
    }
  })
});

app.listen(PORT, () => console.log("Server Started at port: " + PORT));
 