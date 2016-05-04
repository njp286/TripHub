var express = require('express');
var session = require('express-session')
var router = express.Router();
//var authy = require('authy')('41f3fe0a27e1c9cba05c30933811a2b8', 'http://sandbox-api.authy.com');
var authy = require('authy')('YiHSBD4U3V6IThs3KiFRKKZwltpw36KY');

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Trip = mongoose.model('Trip');
var Flight = mongoose.model('Flight');
var Hotel = mongoose.model('Hotel');
var ToDoList = mongoose.model('ToDoList');
var Item = mongoose.model('Item');

var thisUser;

var phoneNum;
var phoneWO;
var firstName;
var lastName;
var email;
var password;

/* GET home page. */

router.get('/', function(req, res) {
  res.redirect('/login');
});

router.get('/login', function(req, res) {
	res.render('login');
});

router.post('/login', function(req, res) {
	// LOGIN VERIFICATION
	var email = req.body.email
	var pass = req.body.password

	User.findOne({email: email, pass: pass}, function(err, user, count) {
		console.log(err, user, count);
		thisUser = user;
		if (thisUser == null) {
         	       res.render('login', {"error": "Error found"});
        	}
        	else{  
                	res.redirect('/home');
        	}
	});
});

router.get('/register', function(req, res){
	res.render('register');
});

router.post('/register', function(req, res) {
	//REGISTRATION VERIFICATION
	var first = req.body.fname;
	var last = req.body.lname;
	var emailADR = req.body.email;
	var phone = req.body.phoneNum;
	var output = [phone.slice(0, 3), '-', phone.slice(3)].join('');
	var phone2 = [output.slice(0, 3), '-', output.slice(3)].join('');
	var pass = req.body.password;
	

	authy.phones().verification_start(phone2, '1', 'sms', function(err, resp) {
		console.log(err);
		console.log(resp);
		if(err == null){
			firstName = first;
			lastName = last;
			email = emailADR;
			password = pass;
			phoneWO = phone;
			phoneNum = phone2;
			res.redirect('/verify');
		}
		else{
			res.render('register', {"error": err});
		}
	});


});

router.get('/verify', function(req, res) {

	res.render('verify');
});

router.post('/verify', function(req, res){
	var verCode = req.body.code;

        authy.phones().verification_check(phoneNum, '1', verCode, function (err, resp) {
                console.log(err);
                console.log(resp);

		if(err == null){
			//add user
        	      
			var usernew = new User({
				fname: firstName,
				lname: lastName,
				email: email,
				pass: password
                	}).save(function(error, users) {
                        	console.log('added an user', users,  error);
				thisUser = users;
				res.redirect('/home');
                	});		

		}
		else {
			res.render('verify', {"error": err.message});
		}
        });
});

router.get('/home', function(req, res) {
	console.log(thisUser.email);


	var trips = Trip.find( { "user": thisUser } );
   	
  
 


	res.render('home', {"trips": trips});
});

router.get('/logout', function(req, res){
	///DEAL W/ Logout Stuff
	res.redirect('/login');
});

router.get('/myTrips/:slug', function(req, res){
	function findSlug(post) {
                return post.slug === req.params.slug;
        }
	//FIND CORRECT PATH
        mongoose.model('ImagePost').find(function(err, imageposts){
                slugpost = imageposts.find(findSlug);
                res.render('detail', {"postingShell": slugpost});
        });
});

router.post('/update/:slug', function(req, res){
	//Update checkboxes when going home
	res.redirect('/home');
});

router.post('/deleteTrip/:slug', function(req, res){

	//DELETE TRIP FROM USER
	res.redirect('/home');
});

router.post('/add/:slug', function(req, res){
	//add to do to list 
	res.redirect('/myTrips/'+req.params.slug);
});

router.get('/addTrip', function(req, res){
	res.render('addTrip');
});

router.post('/addTrip', function(req, res){
	//ADD TRIP TO USER
	var tripName = req.body.name;
	var destination = req.body.dest;
	var departDate = req.body.ddate;
	var flightOut = req.body.flightOutNum;
	var airlineOut = req.body.airOut;
	var terminalOut = req.body.termOut;
	var returnDate = req.body.rdate;
	var returnFlight = req.body.flightInNum;
	var airlineIn = req.body.airIn;
	var terminalIn = req.body.termIn;
	var hotel = req.body.hName;
	var hotelAddr = req.body.hAddress;
	var hotelCheckIn = req.body.hChIn;
	var hotelCheckOut = req.body.hChOut;
	
	if(departDate  && flightOut  && airlineOut  && terminalOut){

		var flightOut12 = new Flight({
 			 airline: airlineOut,
                	 date: departDate,
 	                 flightNum: flightOut,
        	         terminal: terminalOut,
			 user: thisUser
		}).save(function(error, flights) {
                         console.log('added an outgoing flight', flights,  error);
			 //CheckReturnFlight(flights); 
                });
		//CheckReturnFlight(flightOut12);

	} else{
		res.render('addTrip', {"error": "Didn't complete outbound flight information"});
	}
	function CheckReturnFlight(flightOut12){
	if(returnDate && returnFlight && airlineIn && terminalIn && flightOut12){

                var flightIn = new Flight({
                         airline: airlineIn,
                         date: returnDate,
                         flightNum: returnFlight,
                         terminal: terminalIn,
			 user: thisUser}).save(function(error, flight) {
                                 console.log('added a return flight', flight,  error);
			 
                         });
			 CheckHotel(flightIn, flightOut12);
        }else{
                res.render('addTrip', {"error": "Didn't complete return flight information"});
        }
	}
	function CheckHotel(flightIn, flightOut12){
	if(hotel && hotelAddr && hotelCheckIn && hotelCheckOut){

                var hotelNew = new Hotel({
                         name: hotel,
                         address: hotelAddr,
                         chInDate: hotelCheckIn,
                         chOutDate: hotelCheckOut,
			 user: thisUser}).save(function(error, hotel) {
                                 console.log('added a hotel', hotel,  error);  
                         });
		finalizeTrip(flightIn, flightOut12, hotelNew);
        }else{
                res.render('addTrip', {"error": "Didn't complete hotel information"});
        }
	}


	function finalizeTrip(flightIn, flightOut12, hotelNew){
        system.log(tripName);
        system.log(destination);
        system.log(myFlights);

        if (tripName && destination){
                var newTrip = new Trip({
                        name: tripName,
                        destination: destination,
                        flights: [flightIn, flightOut12],
                        hotels: [hotelNew],
                        user: thisUser}).save(function(error, trip) {
                                console.log('added a trip', trip, error);
                                if (error == null){
                                       res.redirect('/home');
                                }
                        });
        }else{
               res.render('addTrip', {"error": "Didn't complete trip information"});
        }
	}


});



module.exports = router;
