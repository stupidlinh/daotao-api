module.exports = function(config) {

    var fs = require('fs');
    var bcrypt = require('bcrypt');
    var jwt = require('jsonwebtoken');
    var obj = {};

    obj.revokeToken = function(token){
        jwt
    }

    obj.checkToken = function(req, res, next) {
        if (req.headers.token) {
            jwt.verify(req.headers.token, 'EdoSuperSecretKey', function(err, user) {
                if (user) {
                    console.log('There is an user');
                    req.user = user;
                    next();
                } else {
                    if (err && err.name == 'TokenExpiredError')
                        res.status(400).json({
                            status: "400 bad request",
                            message: "Your token has expired"
                        })
                    else
                        res.status(400).json({
                            status: "400 bad request",
                            message: "You have an invalid token, probably someone has tried to modify it"
                        });
                }
            });
        } else {
            req.user = null;
            next();
        }
    }



    // obj.checkUserRole() = function(req.user) {
    //     //get Token
    //     if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    //         var decoded = jwt.verify(req.headers.authorization.split(' ')[1], 'EdoSuperSecretKey');
    //         if (decoded) return decoded.role;
    //         else return "invalid_token";
    //     } else return "public";
    // }

    obj.encrypt = function(plainText, done) {
        console.log('hash ', plainText);
        bcrypt.hash(plainText, 10, function(error, encrypted) {
            done(encrypted);
        });
    }

    obj.compare = function(pass, hash, done) {
        bcrypt.compare(pass, hash, function(err, res) {
            return done(err, res);
        });
    }

    obj.queryToJson = function(str) {
        if (typeof str !== 'string') {
            return {};
        }

        str = str.trim().replace(/^(\?|#|&)/, '');

        if (!str) {
            return {};
        }

        return str.split('&').reduce(function(ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            var key = parts.shift();
            var val = parts.length > 0 ? parts.join('=') : undefined;

            key = decodeURIComponent(key);

            val = val === undefined ? null : decodeURIComponent(val);

            if (!ret.hasOwnProperty(key)) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }

            return ret;
        }, {});
    }

    obj.getModelNames = function() {
        var names = [];
        var modelsPath = config.root + '/app/models';
        fs.readdirSync(modelsPath).forEach(function(file) {
            names.push(file.replace('.js', ''));
        });
        return names;
    }

    obj.loadModels = function(mongoose) {
        // config mongoose models
        var models = {};
        var modelsPath = config.root + '/app/models';
        fs.readdirSync(modelsPath).forEach(function(file) {
            if (file.indexOf('.js') >= 0) {
                models[file.replace('.js', '')] = require(modelsPath + '/' + file)(mongoose);
                console.log('Loaded: ' + file.replace('.js', '') + ' model.');
            }
        })
        return models;
    }

    obj.loadControllers = function(models) {
        var ctrls = {};
        var ctrlsPath = config.root + '/app/controllers';
        fs.readdirSync(ctrlsPath).forEach(function(file) {
            if (file.indexOf('.js') >= 0) {
                ctrls[file.replace('.js', '')] = require(ctrlsPath + '/' + file)(models[file.replace('.js', '')], obj);
                console.log('Loaded: ' + file.replace('.js', '') + ' controllers.');
            }
        })
        return ctrls;
    }

    return obj;

}
