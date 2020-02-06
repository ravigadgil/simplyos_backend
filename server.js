const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const app = express();
const formidable = require('formidable');
const pdf = require('pdf-parse');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./_helper/helper');
//var localStorage = require('localStorage')

const PORT = process.env.PORT || 5500;

//mongodb+srv://redus:redis06122002!@cluster0-xwsm9.mongodb.net/simplyopensource?retryWrites=true&w=majority

//Database

//console.log(process.env.NODE_ENV);
let connection;
if (process.env.NODE_ENV == 'development') {
  mongoose.connect('mongodb://127.0.0.1:27017/simplyopensource?retryWrites=true&w=majority');
   connection = {
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'simplyos'
  };
  
}
else {
  mongoose.connect('mongodb://127.0.0.1:27017/simplyopensource?retryWrites=true&w=majority');
   connection = {
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'simplyos'
  };
  //connection.connect();
}
let db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once('open', () => console.log('Connected to MongoDB'));

//Models
let Category = require('./models/Category');
let Test = require('./models/Test');
let TestDone = require('./models/TestDone');
let User = require('./models/User');
let Comment = require('./models/Comment');
let Review = require('./models/Review');
let QuestionWithImage = require('./models/QuestionWithImage');
let MetaInfo = require('./models/MetaInfo');



//API MiddleWares
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
app.use('/api/pdf', express.static(__dirname + '/pathToPDF'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.json()).use(express.urlencoded())

//BodyParser MiddleWares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


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
app.get('/api/categories', (req, res) => {
  console.log('Cs page visited!');
  Category.find({}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});

// Need to implement Every request should be verify with access token
app.get('/api/getAccesToken/:token', (req, res) => {
  const token = req.param.token;

});

app.get('/api/getmeta', (req, res) => {
  const page = req.query.page;
  console.log(page);
  const meta = new MetaInfo();
  let meta_info = {
    'status': false,
    'data' : ''
  };
  (async () => {
    let key = 'meta__' + page;
    let cachedMeta = cache.get(key);
    if (cachedMeta) {
      console.log("cache data..")
      res.send( cachedMeta );
      return
    }
    const result = await meta.getMetaBypage(page);
    if (result) {
      meta_info.status = true;
      meta_info.data = result;
      cache.put(key, meta_info);
    }
    console.log("no cache");
    res.json(meta_info); 
    
 })();
});

app.get('/api/getpages', (req, res) => {
  
  const meta = new MetaInfo();
  let meta_info = {
    'status': false,
    'data' : ''
  };
  (async () => {
    const result = await meta.getMetaAllpage();
    if (result) {
      meta_info.status = true;
      meta_info.data = result;
    }
    res.json(meta_info);
    
  })();
});

app.delete('/api/delete-meta/:id', (req, res) => {
  const id = req.params.id;
  let key = 'meta__' + req.body.path;
  const meta = new MetaInfo();
  let meta_info = {
    'status': false,
    'data' : ''
  };
  (async () => {
    const result = await meta.deleteMeta(id);
    console.log(result);
    if (result) {
      meta_info.status = true;
      meta_info.data = 'Delete Record';
      let cachedMeta = cache.get(key);
      if (cachedMeta) {
        cache.del(key);
      }
    }
    res.json(meta_info);
  })();
});


app.post('/api/postmeta', (req, res) => {
  const meta = new MetaInfo();
  let meta_info = {
    'status': false,
    'msg' : ''
  };
  //console.log(localStorage.getItem('username'));
  (async () => {
    const result = await meta.getMetaBypage(req.body.page_path);
    if (result) {
      let updateMeta = req.body;
      const update = await meta.updateMeta(req.body.page_path, updateMeta);
      if (update) {
        meta_info.status = true;
        meta_info.msg = 'Update the Record';
        let page = req.body.page_path;
        key = 'meta__' + page;
        cache.del(key);
      }
      
    }
    else {
      const insert = await meta.insertMeta(req.body);
      if (insert) {
        console.log("Insert Data element");
        meta_info.status = true;
        meta_info.msg = 'Data has been insert';
      }
    }
    //delete the cache
    
    res.json(meta_info);
  })();
});

//Get All Tests
app.get('/api/tests', (req, res) => {
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
app.get('/api/tests/category/:id/:limit', (req, res) => {
  const id = req.params.id;
  Test.find({category_id: id}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  }).limit(parseInt(req.params.limit)).sort({date: -1})
});

//Get All Tests Of A Category
app.get('/api/tests/category/:id/', (req, res) => {
  const id = req.params.id;
  Test.find({category_id: id}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  }).sort({date: -1})
});

//Get Test
app.get('/api/test/:id', (req, res) => {
  const id = req.params.id;
  Test.findOne({_id: id}, (err, data) => {
    if(err) {
      res.json('Error');
    } else {
      res.json(data);
    }
  });
});


app.get('/api/test1', (req, res) => {
  console.log("test");

});
//Add Category
app.post('/api/category/add/:cat_name', (req, res) => {
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
app.post('/api/getPDf', (req, res) => {
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
app.post('/api/tests/add/:title/:pdfName/:cat_id/:header', (req, res) => {
  const title = req.params.title;
  const footer = '"Pass Any Exam. Any Time." - www.actualtests.com';
  const header = req.param.header;
  const pdfName = req.params.pdfName;
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
      myData = myData.filter(data => !data.includes(header) && !data.includes('Click and drag') && !data.includes('ActualTests.com') && !data.includes('Practice Exam') && !data.includes('Exam') && !data.includes('Pass Any Exam. Any Time') &&
      !data.includes('Explanation:') && !data.includes(footer) && !data.includes(req.params.title))

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
      if(answer != null && answer != undefined) {
        console.log(answer)
        questions.push(questionOutput);
        answers.push(answer);
      }
    }   
    let test = new Test();
    test.questions = questions;
    test.answers = answers;
    test.category_id = cat_id;
    test.title = title;
    test.date = new Date();
    test.reviews_sum = 0;
    test.reviews_length = 0;
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

app.get('/api/search/:query', (req, res) => {
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

app.post('/api/upload', upload.single('avatar'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
    res.send(file)
});

app.post('/api/deleteCategory/:id', (req, res) => {
  Category.remove({_id: req.params.id}, (err) => {
    if(err)
      res.json(err);
    res.json({msg: "Deleted"});
  })
});

app.post('/api/deleteTest/:id', (req,res) => {
  Test.remove({_id: req.params.id}, (err) => {
    if(err)
      res.json(err);
    res.json({msg: "Deleted"});
  })
});

//Get Users
app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
});

app.post('/api/user/validate/', (req, res) => {
  try {
    User.find({'username':req.body.username, password:req.body.pass}, (err, data) => {
     if(err) {
       res.json(err);
     } else {
       console.log(data);
       if (data.length) {
        console.log(req.body.username);
        //res.send('user data added to cookie'); 
        console.log(data[0]['_id']);
        let data_info = {'username':req.body.username, 'id':data[0]._id};
        res.json({'login': true, 'data_info': data_info});
        
       }
       else {
        res.json({'login': false,  msg: "User Name or Password not match with our records"});
       }
       
     }
   })
  }catch(e) {
    res.json({msg: "fail"});
  }
});

//Add Users
app.post('/api/users/:username/:email/:pass/:certifications/:qualifications/:organization', (req, res) => {
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
      res.json(user);
    }
  });
});

//Delete Users
app.post('/api/users/delete/:id', (req, res) => {
  User.remove({_id: req.params.id}, (err) => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: "Deleted"});
    }
  })
});

//Get Single User
app.get('/api/users/:username', (req, res) => {
  try {
    User.findOne({_id: req.params.username}, (err, data) => {
      if(err) {
        res.json(err);
      } else {
        res.json(data);
      }
    })
  } catch(e) {
    res.json({msg: "fail"});
  }
});

//Add Tests To The User
app.post('/api/users/addTest/:user/:test_id', (req, res) => {
  User.findOne({_id: req.params.user}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      if(data.tests.includes(req.params.test_id)) {
        res.json({msg: "Updated"});
      } else {
        data.tests.unshift(req.params.test_id);
        User.update({_id: req.params.user}, {tests: data.tests}, (err) => {
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
app.get('/api/users/title/:id/:user_id', (req, res) => {
  try {
    Test.findOne({_id: req.params.id}, (err, data) => {
      if(err) 
        res.json(err);
      else
        try {
          TestDone.findOne({user_id: req.params.user_id, test_id: req.params.test_id}, (err, test) => {
            if(err) {
              res.json(err);
            } else {
              try {
                res.json({title: data.title, id: req.params.id, score: test.score});
              } catch(e) {

              }
            }
          })
        } catch(e) {
          
        }
    });
  } catch(e) {
    res.json({msg: 'Fail'})
  }
});

//Update Profile
app.post('/api/users/update/:user_id/:certifications/:qualifications/:organization', (req, res) => {
  User.update({_id: req.params.user_id}, {username: req.params.username, certifications: req.params.certifications,
    organization: req.params.organization, qualifications: req.params.qualifications}, (err) => {
      if(err) {
        res.json(err);
      } else {
        res.json({msg: "Updated"});
      }
    })
});

//Update Test Review
app.post('/api/tests/review/:review/:id/:user_id', (req, res) => {
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
                  review.review = parseInt(req.params.review);
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
app.get('/api/reviews/user/:user_id', (req, res) => {
  Review.find({user_id: req.params.user_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else { 
      res.json(data);
    }
  })
});

//Get Reviews Of A User of a test
app.get('/api/reviews/user/:user_id/:test_id', (req, res) => {
  Review.findOne({user_id: req.params.user_id, post_id: req.params.test_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else { 
      res.json(data);
    }
  })
});

//Get Review By Review ID
app.get('/api/review/reviewId/:r_id', (req, res) => {
  Review.findOne({_id: req.params.r_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})


//Get All Comments
app.get('/api/comments', (req, res) => {
  Comment.find({}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Get all comments from a user
app.get('/api/comments/user/:user_id', (req, res) => {
  Comment.find({user_id: req.params.user_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Get all comments from a post
app.get('/api/comments/post/:post_id', (req, res) => {
  Comment.find({post_id: req.params.post_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

//Add Reviews As Comments
app.post('/api/comments/add/:comment/:user_id/:post_id', (req, res) => {
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

//Update User Review
app.post('/api/reviews/update/:id/:review', (req, res) => {
  Review.updateOne({_id: req.params.id}, {review: req.params.review}, (err) => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: 'Updated'})
    }
  })
})

//Update Test
app.post('/api/tests/update/:post_id/:title', (req, res) => {
  Test.updateOne({_id: req.params.post_id}, {updated: true, date: new Date(), title: req.params.title}, (err) => {
    if(err) {
      res.json(err);
    } else {
      res.json({msg: "Updated"})
    }
  })
})

//Get user by username
app.get('/api/user/username/:username', (req, res) => {
  User.findOne({username: req.params.username}, (err, data) => {
    if(err) {
      res.json(err)
    } else {
      res.json(data)
    }
  })
})

app.put('/api/update/test/:id', (req, res) => {
  const id = req.params.id;
  if(req.body.answers !== undefined && req.body.questions !== undefined) {
    Test.updateOne({_id: id}, {answers: req.body.answers, questions: req.body.questions}, (err) => {
      if(err) {
        res.json(err)
      } else {
        res.json({msg: 'Updated'})
      }
    })
  } else {
    res.json({msg: "ERROR"})
  }
})

app.get('/api/imageQuestion/:test_id', (req, res) => {
  QuestionWithImage.find({test_id: req.params.test_id}, (err, data) => {
    if(err) {
      res.json(err);
    } else {
      res.json(data);
    }
  })
})

app.post('/api/add/imageQuestion/:test_id', (req, res) => {
  const test_id = req.params.test_id;
  const question = req.body.question;
  const answer = req.body.answer;
  const href = req.body.href;
  const post = new QuestionWithImage();
  post.test_id = test_id;
  post.question = question;
  post.answer = answer;
  post.href = href;
  post.save(err => {
    if(err) {
      res.json(err)
    } else {
      res.json({msg: 'Added'})
    }
  })
})

// other routes 
let routesPath = [
  '/',
  '/categories',
  '/tests/:category_id/:category_name',
  '/tests/:category_id/:category_name',
  '/search/:text_query',
  '/test/:test_id/:test_name',
  '/myaccount',
  '/user/login',
  '/meta/insert',
  '/signup',
  '/update',
  '/review/:post_id',
  '/reviews/:user_id',
  '/reviews/update/:review_id',
  '/admin/users',
  '/admin/update',
  '/admin/update/:id',
  '/admin/insert/',
  '/admin/delete/'
];
app.get(routesPath, function(request, response) {
  const filePath = path.resolve(__dirname, './build', 'index.html');
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    helper.modifyMetaInfo(filePath, request.originalUrl.substring(1)).then(function(meta){
      if (meta.status === true) {
      let description = JSON.parse(String.fromCharCode.apply(null, new Uint16Array(meta.data.meta_info)));
       
      data = data.replace(/\$OG_TITLE/g, meta.data.title);
      data = data.replace(/\$OG_Keword/g, meta.data.keyword);
      result = data.replace(/\$OG_DESCRIPTION/g, description.des);
    }
    else {
      data = data.replace(/\$OG_TITLE/g, 'Home Page');
      data = data.replace(/\$OG_Keword/g, 'Home Page');
      result = data.replace(/\$OG_DESCRIPTION/g, "Home page description");
    }
    response.send(result);
    });
  });
});


app.use(express.static(path.resolve(__dirname, './build')));

app.get('*', function(request, response) {
  const filePath = path.resolve(__dirname, './build', 'index.html');
  response.sendFile(filePath);
});

app.listen(PORT, () => console.log("Server Started at port: " + PORT));
 