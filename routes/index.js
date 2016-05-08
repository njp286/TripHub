var express = require('express');
var session = require('express-session')
var router = express.Router();
//var authy = require('authy')('41f3fe0a27e1c9cba05c30933811a2b8', 'http://sandbox-api.authy.com');
var authy = require('authy')('YiHSBD4U3V6IThs3KiFRKKZwltpw36KY');
var Flickr = require('node-flickr');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Trip = mongoose.model('Trip');
var Flight = mongoose.model('Flight');
var Hotel = mongoose.model('Hotel');
var ToDoList = mongoose.model('ToDoList');
var Item = mongoose.model('Item');
var fs = require('fs');




var keys = {"api_key": "7a55b9d8e3e3aca6b8eae1e310404f60"}
flickr = new Flickr(keys);

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
		req.session.thisUser = user;
		if (req.session.thisUser == null) {
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
	var phone2 = [output.slice(0, 7), '-', output.slice(7)].join('');
	var pass = req.body.password;
	

	authy.phones().verification_start(phone2, '1', 'sms', function(err, resp) {
		console.log(err);
		console.log(resp);
		if(err == null){
			req.session.firstName = first;
			req.session.lastName = last;
			req.session.email = emailADR;
			req.session.password = pass;
			req.session.phoneWO = phone;
			req.session.phoneNum = phone2;
			res.redirect('/verify');
		}
		else{
			res.render('register', {"error": err});
		}
	});


});

router.get('/reregister', function(req, res){



	authy.phones().verification_start(req.session.phoneNum, '1', 'sms', function(err, resp) {
			if(err == null){
				console.log(resp);
				var message = 'Text message sent to ' + req.session.phoneNum + '.';
				res.render('verify', {"error": message});
			}
			else{
				res.render('verify', {"error": err});
			}
		});

});

router.get('/verify', function(req, res) {

	res.render('verify');
});

router.post('/verify', function(req, res){
	var verCode = req.body.code;

        authy.phones().verification_check(req.session.phoneNum, '1', verCode, function (err, resp) {
                console.log(err);
                console.log(resp);

		if(err == null){
			//add user
        	      
			var usernew = new User({
				fname: req.session.firstName,
				lname: req.session.lastName,
				email: req.session.email,
				pass: req.session.password
            }).save(function(error, users) {
                console.log('added an user', users,  error);
				req.session.thisUser = users;
				res.redirect('/home');
            });		

		}
		else {
			res.render('verify', {"error": err.message});
		}
        });
});

router.get('/home', function(req, res) {

	if (req.session.thisUser == null){
		res.render('login');
		return;
	}

	Trip.find({user: req.session.thisUser.slug}, function(err, trips, count){
			res.render('home', {"trips": trips, "user": req.session.thisUser});
	});

});

router.get('/logout', function(req, res){
	///DEAL W/ Logout Stuff
	req.session = null;
	res.redirect('/login');
});

router.get('/myTrips/:slug', function(req, res){

		if (req.session.thisUser == null){
			res.redirect('/login');
			return;
		}
		var tripToShow;
		var tripWeather;

		Trip.findOne({slug: req.params.slug}, function(err, trip, count) {
			tripToShow = trip;
			
			getTripInfo();
                        
        });



        function getTripInfo(){
        	var departFlight, returnFlight, hotel, trip, tripToDoList;

        	departFlight = tripToShow.flights[0];
        	returnFlight = tripToShow.flights[1];
        	hotel = tripToShow.hotels[0];
        	trip = tripToShow;

	
        	var tripItems = [];
        	var size;
	        var counter = 0;

	        function findItem(obj){
	        	Item.findOne({slug: obj.slug }, function(err, item, count) {
	        		tripItems.push(item);
	        		counter += 1;
	        		if (counter == size){
	        			flickr.get("photos.search", {"text":trip.destination + ' vacation'}, function(err, result){
	        				var photos = JSON.stringify(result);
	        				fs.writeFile('public/json/photos.json', JSON.stringify({"photo": result.photos.photo}), function (err) {
	        						var log = fs.readFile('public/json/photos.json', function(error, obj){
	        							var string = JSON.parse(obj);
		        						console.log(err);
	  									res.render('myTrip', {"departFlight" : departFlight, "returnFlight": returnFlight, "hotel" : hotel, "trip": trip, "toDoList": tripItems, "image": result.photos.photo[0]});
	        						});

							});
   						});

	        		}
	        		return obj;
				});
	        }

        	Flight.findOne({slug: departFlight.slug}, function(err, flight, count) {
				departFlight = flight;    
				Flight.findOne({slug: returnFlight.slug}, function(err, flights, count) {
					returnFlight = flights;  
					Hotel.findOne({slug: hotel.slug}, function(err, hotels, count) {
						hotel = hotels;  
						ToDoList.findOne({slug: tripToShow.toDo[0].slug}, function (errorTD, list) {
	        				tripToDoList = list.items;
	        				size = tripToDoList.length;
	        				if (size > 0){
	        					tripToDoList = tripToDoList.map(findItem);
	        				}
	        				else {
	        					res.render('myTrip', {"departFlight" : departFlight, "returnFlight": returnFlight, "hotel" : hotel, "trip": trip, "toDoList": tripItems});
	        				}
        				});     
        			});    
       			});  
       		});

        	
        }



	
});


//function for saving checkboxes when going home
router.post('/update/:slug', function(req, res){
	//Update checkboxes when going home
	if (req.session.thisUser == null){
		res.redirect('/login');
		return;
	}

	var updatedItems;
	var myArray = req.body.checkedToDo;
	var changesMade = 0;
	Trip.findOne({slug: req.params.slug}, function(err, trip, count) {
			if(trip.toDo[0] == undefined){
				res.redirect('/home');
			}
			else {
				updateSlugs(myArray);
        	}

        	
        function updateSlugs(element){

        		var thisElement;
        

        		function mapBySlug(obj) {

        			thisElement = obj.slug;
								
        		   	if(Array.isArray(element)){
							if (element.indexOf(thisElement) != -1) {
					  			Item.findOne({slug: obj.slug }, function(err, item, count) {
								    // we can call push on toppings!
									item.completed = true;
									item.save(function(saveErr, saveItem, saveCount) {
										
										console.log(saveItem);	
										return obj;
									});
								});
					  		
					  			
									
							}
					    	else {
					    		Item.findOne({slug: obj.slug }, function(err, item, count) {
								    // we can call push on toppings!
									item.completed = false;
									item.save(function(saveErr, saveItem, saveCount) {
										
										console.log(saveItem);
										return obj;	
									});
								});
								
					    	}
	        		   }
					  else if (obj.slug == element) {
					  		Item.findOne({slug: obj.slug }, function(err, item, count) {
								    // we can call push on toppings!
									item.completed = true;
									item.save(function(saveErr, saveItem, saveCount) {
										
										console.log(saveItem);	
										return obj;
									});
								});
					  } else {
					  		Item.findOne({slug: obj.slug }, function(err, item, count) {
								    // we can call push on toppings!
									item.completed = false;
									item.save(function(saveErr, saveItem, saveCount) {
										
										console.log(saveItem);	
										return obj;
									});
								});
					  }	
        		   
				}

				function move(obj){
					res.redirect('/home');
				}


        		ToDoList.findOne({slug: trip.toDo[0].slug}, function (errorTD, list) {
        			updatedItems = list.items;
        			console.log(updatedItems);
        			var newMap = list.items.map(mapBySlug);
        			var trans = move(newMap);
        	        			
	        		
	        });
	    }
	});
                       
	
});

router.post('/deleteTrip/:slug', function(req, res){

	if (req.session.thisUser == null){
		res.redirect('/login');
		return;
	}

	Trip.remove({slug: req.params.slug}, function(error){
		res.redirect('/home');
	});
});

router.post('/add/:slug', function(req, res){
	
	if (req.session.thisUser == null){
		res.redirect('/login');
		return;
	}

	var itemToAdd;
	var tripToDoList;
	var myTrip;

	//add item 
	var newItem = new Item({
                         name: req.body.toDo,
                         completed: false
			 	}).save(function(error, item) {
                         console.log('added an item', item,  error); 
                         itemToAdd = item;
                         addToToDoList();
                });


	//add to do to list 
	function addToToDoList(){
		Trip.findOne({slug: req.params.slug}, function(err, trip) {
				var toDoList = trip.toDo[0];
				//no to do list
				ToDoList.findOne({slug: toDoList.slug}, function (errorTD, list) {
					list.items.push(itemToAdd);
					list.save(function(toDoError, toDoSave){
						if(toDoError == null){
							trip.toDo = [toDoSave];
							trip.save(function(error, save){
							
								res.redirect('/myTrips/' + req.params.slug);
								
							
							});
						}
					});

				});
				     
        });
	
	}	
});

router.get('/addTrip', function(req, res){
	if (req.session.thisUser == null){
		res.redirect('/login');
		return;
	}

	res.render('addTrip');
});

router.post('/addTrip', function(req, res){
	//ADD TRIP TO USER
	if (req.session.thisUser == null){
		res.redirect('/login');
		return;
	}

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
	
	var tripFlightOut;
	var tripFlightIn;
	var tripHotel;
	var thisTrip;

	if(departDate  && flightOut  && airlineOut  && terminalOut){

		var flightOut12 = new Flight({
 			 		airline: airlineOut,
                	 date: departDate,
 	                 flightNum: flightOut,
        	         terminal: terminalOut
        	     }).save(function(error, flights) {
                         console.log('added an outgoing flight', flights,  error);
                         tripFlightOut = flights;
                         CheckReturnFlight();

                });

	} else{
		res.render('addTrip', {"error": "Didn't complete outbound flight information"});
	}
	function CheckReturnFlight(){
	if(returnDate && returnFlight && airlineIn && terminalIn && flightOut12){

            var flightIn = new Flight({
                         airline: airlineIn,
                         date: returnDate,
                         flightNum: returnFlight,
                         terminal: terminalIn
			 }).save(function(error, flight) {
                                 console.log('added a return flight', flight,  error);
                                 tripFlightIn = flight;
			 	 				 CheckHotel();
                         });
			
        }else{
                res.render('addTrip', {"error": "Didn't complete return flight information"});
        }
	}
	function CheckHotel(){
	if(hotel && hotelAddr && hotelCheckIn && hotelCheckOut){

                var hotelNew = new Hotel({
                         name: hotel,
                         address: hotelAddr,
                         chInDate: hotelCheckIn,
                         chOutDate: hotelCheckOut,
			 	}).save(function(error, hotel) {
                         console.log('added a hotel', hotel,  error); 
                         tripHotel = hotel; 
                         finalizeTrip();
                });

		
        }else{
                res.render('addTrip', {"error": "Didn't complete hotel information"});
        }
	}


	function finalizeTrip(){
		console.log()

		var newItem = new Item({
			name: "Have an awesome trip!", 
			completed: false
		}).save(function(err, saveItem){
			var newToDoList = new ToDoList({
						name: tripName, 
						items: [saveItem]
				}).save(function(error, todo) {
					console.log(error)
					console.log('New toDoList added', todo);
					if (tripName && destination){
			                var newTrip = new Trip({
			                        name: tripName,
			                        user: req.session.thisUser.slug,
			                        destination: destination,
			                        flights: [tripFlightOut, tripFlightIn],
			                        hotels: [tripHotel], 
			                        toDo: [todo]
			                     	}).save(function(error, trip) {
			                                console.log('added a trip', trip, error);
			                                if (error == null){
			                                	    thisTrip = trip;
			                                	  	res.redirect('/home');
			                                       
			                                }
			                        });
			        }else{
			               res.render('addTrip', {"error": "Didn't complete trip information"});
			        }					
								
			});

		});
		

        
	}
	

});



module.exports = router;
