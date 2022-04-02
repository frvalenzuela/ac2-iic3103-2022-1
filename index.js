const express = require('express')
const bodyParser = require("body-parser");
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//db.sequelize.sync({ force: true }).then(() => {
//  console.log("Drop and re-sync db.");
//});

const Op = Sequelize.Op;

// Extract from 
// https://stackoverflow.com/questions/8532406/create-a-random-token-in-javascript-based-on-user-details
function generate_token(length){
    //edit the token allowed characters
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

// Extract from 
// https://stackoverflow.com/questions/3885817/how-do-i-check-that-a-number-is-float-or-integer
function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

// Extract from 
// https://stackoverflow.com/questions/34151834/javascript-array-contains-includes-sub-array
function hasSubArray(master, sub) {
    return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
}

const User = sequelize.define("user", {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "username is required" },
      },
    },
    password: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "name is required" },
      },
    },
    age: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "age is required" },
      },
    },
    psu_score: {
      type: Sequelize.INTEGER
    },
    university: {
      type: Sequelize.STRING
    },
    gpa_score: {
      type: Sequelize.FLOAT
    },
    job: {
      type: Sequelize.STRING
    },
    salary: {
      type: Sequelize.FLOAT
    },
    promotion: {
      type: Sequelize.BOOLEAN
    },
    hospital: {
      type: Sequelize.STRING
    },
    operations: {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    },
    medical_debt: {
      type: Sequelize.STRING
    }
  });

const UserToken = sequelize.define("userToken", {
    token: {
      type: Sequelize.STRING
    }
});

const AccessToken = sequelize.define("accessToken", {
    app_id: {
      type: Sequelize.STRING
    },
    scopes: {
      type: Sequelize.STRING
    },
    expiration: {
      type: Sequelize.DATE
    },
    token: {
      type: Sequelize.STRING
    }
});

const AccessTokenRequest = sequelize.define("accessTokenRequest", {
    app_id: {
      type: Sequelize.STRING
    },
    nonce: {
      type: Sequelize.STRING
    },
    expiration: {
      type: Sequelize.DATE
    },
});

UserToken.belongsTo(User, {
     onDelete: 'CASCADE'
});
User.hasMany(AccessToken, {
     onDelete: 'CASCADE'
});
User.hasMany(AccessTokenRequest, {
     onDelete: 'CASCADE'
});


check_type_user = (user)=> {
  if(typeof user.username !== 'string' && user.username !== undefined) { return  false}
  if(typeof user.password !== 'string' && user.password !== undefined) { return  false}
  if(typeof user.name !== 'string' && user.name !== undefined) { return  false}
  if(!isInt(user.age) && user.age !== undefined) { return  false}
  if(!isInt(user.psu_score) && user.psu_score !== undefined) { return  false}
  if(typeof user.university !== 'string' && user.university !== undefined) { return  false}
  if(!isFloat(user.gpa_score) && user.gpa_score !== undefined) { return  false}
  if(typeof user.job !== 'string' && user.job !== undefined) { return  false}
  if(!isFloat(user.salary) && user.salary !== undefined) { return  false}
  if(typeof user.promotion !== 'boolean' && user.promotion !== undefined) { return  false}
  if(typeof user.hospital !== 'string' && user.hospital !== undefined) { return  false}
  if(user.operations !== undefined) { 
    if(!user.operations.every(i => (typeof i === "string"))){
      return  false
    }
  }
  if(!isFloat(user.medical_debt) && user.medical_debt !== undefined) { return  false}
  return true;
}


create_user_nv = (req, res) => {
  // Create a user
  const user = {
    username: req.body.username,
    password: req.body.password ? req.body.password : "",
    name: req.body.name,
    age: req.body.age,
    psu_score: req.body.psu_score? req.body.psu_score : -1,
    university: req.body.university? req.body.university : "",
    gpa_score: req.body.gpa_score? req.body.gpa_score : -1.0,
    job: req.body.job? req.body.job : "",
    salary: req.body.salary? req.body.salary : -1.0,
    promotion: req.body.promotion? req.body.promotion : false,
    hospital: req.body.hospital? req.body.hospital : "",
    operations: req.body.operations? req.body.operations : [""],
    medical_debt: req.body.medical_debt? req.body.medical_debt : -1.0,
  };

  if(!check_type_user(user)){
    res.status(400).send({
            error:
              "invalid attributes"
    });
  } else{
    User.create(user)
    .then(data => {
      UserToken.create({userId: data.id, token:generate_token(30)})
        .then(data_t => {
          res.status(201).send({"id": data_t.userId, "token": data_t.token});
        })
        .catch(err => {
          res.status(400).send({
            error:
              "invalid attributes"
          });
        });

    })
    .catch(err => {
      res.status(400).send({
        error:
          "invalid attributes"
      });
    });
  }
}

check_username = (req, res, fucc, msg) => {
  User.findOne({
    where: {
      username: req.body.username,
    }
  })
  .then(single_user => {
        if (single_user !== null) {
          res.status(409).send({
            error:
            msg
          });     
        }
        else{
          fucc(req, res)
        }
  })
  .catch(err => {
      res.status(400).send({
        error:
          "invalid attributes"
      });
    });

}

create_user = (req, res) => {
  // Validate request
  if (!req.body.username || !req.body.name || !req.body.age ) {
    res.status(400).send({
      message: "invalid attributes"
    });
    return;
  }

  check_username(req, res, create_user_nv,  "user already exists")
  
};

find_single_user = (req, res, exclude_array) => {
  User.findOne({
    attributes: {exclude: exclude_array},
    where: { id : parseInt(req.params.id) }
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Not found`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving user"
      });
    });
}


update_user = (req, res) => {
  const id = req.params.id;
  if(!check_type_user(req.body)){
    res.status(400).send({
            error:
              "invalid attributes"
    });
  } else{
      User.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        check_and_get_user(req, res);
      } else {
        res.status(400).send({
          message: `invalid update`
        });
      }
    })
    .catch(err => {
      res.status(400).send({
        message: "invalid update"
      });
    });
  }

}

check_and_get_user = (req, res) => {
  let exclude_array = ['password', 'createdAt', 'updatedAt'];
  let basic_array = ['username', 'name', 'age'];
  let education_array = ['psu_score', 'university', 'gpa_score'];
  let work_array = ['job', 'salary', 'promotion'];
  let medical_array = ['hospital', 'operations', 'medical_debt'];
  let total = exclude_array.concat(basic_array,education_array, work_array, medical_array);
  let difference = [];
  if (!req.params.scope){
    find_single_user(req, res, exclude_array);
  } else{
    if(req.params.scope === "basic" ){
      difference = total.filter(x => !basic_array.includes(x));
    } else if(req.params.scope === "education" ){
      difference = total.filter(x => !education_array.includes(x));
    } else if(req.params.scope === "work" ){
      difference = total.filter(x => !work_array.includes(x));
    } else if(req.params.scope === "medical" ){
      difference = total.filter(x => !medical_array.includes(x));
    } else{
      res.status(404).send("Not Found");
      return;
    }
    find_single_user(req, res, difference);
  }
}

check_and_update_user = (req, res) => {
  if (!req.body.id){
    if (!req.body.username) {
        update_user(req, res)
      } else{
        check_username(req, res, update_user, "username is taken”")
      }
    
  } else{
      res.status(400).send({
        message: "invalid update"
      });
  }

}

del_user = (req, res) => {
  const id = req.params.id;
  User.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(204).send("No content");
      } else {
        res.send({
          message: `Cannot delete`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error in delete"
      });
    });
}

check_exp_tkn = (acc_tkn_obj) => {
  let diff = acc_tkn_obj.expiration - Date.now();
  if (Math.abs(diff/ 1000) <= 60.0) {
    return true;
  } 
  return false;
}

check_scope_tkn = (url, acc_tkn_obj) => {
  if(url === undefined){return false}
  const scope = url.split('/').slice(-1)[0]
  return acc_tkn_obj.scopes.includes(scope)
}

token_acc_flow = (req, res, fucc) => {
  const id = parseInt(req.params.id);
  AccessToken.findOne({
      where: {
        token: req.headers.authorization,
      }
    })
    .then(single_user => {
          if (single_user === null) {
            res.status(401).send({
              error:
              "invalid token"
            });     
          }
          else{
            if (single_user.userId !== id){
              res.status(403).send({
              error:
              "you do not have access to this resource"
            });
            } else{
              if(check_exp_tkn(single_user) && check_scope_tkn(req.originalUrl, single_user)){
                fucc(req, res)
              } else{
                res.status(401).send({
                  error:
                  "invalid token"
                });
              }
            }
          }
    });
}

token_flow = (req, res, fucc) => {
const id = parseInt(req.params.id);
  if (!req.headers.authorization) {
    res.status(401).send({ error: 'invalid token' });
    return;
  }

  UserToken.findOne({
    where: {
      token: req.headers.authorization,
    }
  })
  .then(single_user => {
        if (single_user === null) {

          token_acc_flow(req, res, fucc)     
        }
        else{
          if (single_user.userId !== id){
            res.status(403).send({
            error:
            "you do not have access to this resource"
          });
          } else{
            fucc(req, res)
          }
        }
  });
}

get_single_user = (req, res) => {
  token_flow(req, res, check_and_get_user)
}

update_single_user = (req, res) => {
  token_flow(req, res, check_and_update_user)
}

delete_single_user = (req, res) => {
  token_flow(req, res, del_user)
}

get_oauth_req = (req, res) => {
  const valid_scopes = ['basic', 'education', 'work', 'medical'];
  if(!req.query.user_id || !req.query.scopes || !req.query.app_id){
    res.status(400).send({
            error:
            "invalid oauth request"
    });
  } else{
    const scopes = req.query.scopes.split(",")
    const num = Number(req.query.user_id)
    const condition_int = Number.isInteger(num) && num > 0
    const condition_valid = condition_int && hasSubArray(valid_scopes, scopes)
    const nonce_req = generate_token(20);
    const url_out = req.originalUrl.replace('request', 'grant')+"&nonce="+nonce_req

    if(!condition_int){
      res.status(404).send({
            error:
            "user not found"
    })
    } else if(!condition_valid){
      res.status(400).send({
            error:
            "invalid oauth request"
    })
    }else{
      const msg = req.query.app_id + "  está intentando acceder a " + req.query.scopes + ", ¿desea continuar?"
      User.findOne({
    attributes: {exclude: ['password']},
    where: { id : num }
  })
    .then(data_u => {
      if (data_u) {

        const actokreq = {
          app_id: req.app_id,
          nonce: nonce_req,
          expiration: Date.now()
        }

        AccessTokenRequest.create(actokreq)
          .then(data => {
            res.status(202).send({message: msg, grant_url: url_out, expiration: Number(data.expiration)});
          })
          .catch(err => {
            res.status(500).send({
              message:
                err.message || "Some error occurred"
            });
          });
      } else {
        res.status(404).send({
          message: `user not found`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving user"
      });
    });
    }
  }
}

create_acc_tkn = (req, res) =>{
  const acc_tkn = {
          userId: req.query.user_id,
          app_id: req.query.app_id,
          scopes: req.query.scopes,
          expiration: Date.now(),
          token: generate_token(30)
  }
  AccessToken.create(acc_tkn)
    .then(data_t => {
      res.status(200).send({"access_token": data_t.token, "expiration": Number(data_t.expiration)});
    })
    .catch(err => {
      res.status(503).send({
        error:
          "error acc token grant"
      });
    });
}

check_acc_tkn = (req, res) =>{
  AccessTokenRequest.findOne({
    where: { nonce : req.query.nonce }
    })
    .then(data => {

      if (data === null) {
          res.status(406).send({
          message: `invalid authorization grant`
        });    
        }
        else{
          let diff = data.expiration - Date.now();
          if (Math.abs(diff/ 1000) <= 10.0) {
            create_acc_tkn(req, res);
          } else {
            res.status(406).send({
              message: `invalid authorization grant`
            });
          }
        }
      
    })
    .catch(err => {
      console.log(err)
      res.status(500).send({
        message: "Error retrieving acc_tkn"
      });
    });
}

user_grant = (req, res) =>{
  const valid_scopes = ['basic', 'education', 'work', 'medical'];
  if(!req.query.user_id || !req.query.scopes || !req.query.app_id || !req.query.nonce) {
    res.status(400).send({
            error:
            "invalid oauth grant"
    });
  } else{
    const scopes = req.query.scopes.split(",")
    const condition_valid = hasSubArray(valid_scopes, scopes)

    if(!condition_valid){
      res.status(400).send({
            error:
            "invalid oauth grant"
    })
    } else{
      User.findOne({
    attributes: {exclude: ['password']},
    where: { id : parseInt(req.query.user_id)}
  })
    .then(data_u => {
      if (data_u) {
        check_acc_tkn(req, res)  
      } else {
        res.status(404).send({
          message: `user not found`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving user"
      });
    });
    }
  

    }
}

get_oauth_grant = (req, res) =>{
  const num = Number(req.query.user_id)
  const condition_int = Number.isInteger(num) && num > 0
  if(!condition_int){
      res.status(403).send({
            error:
            "you don't have access to this resource"
    })
  } else{
    req.params.id = req.query.user_id
    token_flow(req, res, user_grant)
  }
  
}

const app = express()
const port = process.env.PORT || 5000
app.enable('trust proxy');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/status', (req, res) => {

  res.status(204 ).send("No content");
})

app.get('/info', (req, res) => {
  let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.status(200).json({ url: fullUrl });
})

app.delete('/security', (req, res) => {
  res.status(401 ).send("Unauthorized");
})

app.get('//status', (req, res) => {

  res.status(204 ).send("No content");
})

app.get('//info', (req, res) => {
  let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.status(200).json({ url: fullUrl });
})

app.delete('//security', (req, res) => {
  res.status(401 ).send("Unauthorized");
})

app.get('/reset', (req, res) => {
  db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
  res.sendStatus(200);
  });
})

app.post('/users', create_user);

app.get('/users/:id', get_single_user);
app.get('/users/:id/:scope', get_single_user);

app.patch('/users/:id', update_single_user);

app.delete('/users/:id', delete_single_user);

app.get('/oauth/request', get_oauth_req);

app.get('/oauth/grant', get_oauth_grant);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//