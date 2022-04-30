const expressJwt = require('express-jwt');
const config = require('config.json');
const userService = require('../users/user.service');

module.exports = jwt;

function jwt() {

    console.log('In Jwt');
    const secret = config.secret;
    console.log("secret",secret);

    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/users/login',
            '/users/register',
            '/users/register-admin',
            '/admin/user/login',
            '/admin/user/add-admin',
             '/',
        ]
    });
}

async function isRevoked(req, payload, done) {
 const user = await userService.getById(payload.sub);
 //console.log({user});
   // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};