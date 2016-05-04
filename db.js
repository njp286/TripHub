var mongoose = require('mongoose'),
	URLSlugs = require('mongoose-url-slugs');

// my schema goes here!


var User = new mongoose.Schema({
        fname: String,
        lname: String,
        email: String,
        pass: String
});

User.plugin(URLSlugs('email'));

var Item = new mongoose.Schema({
        name: String,
        completed: Boolean,
	user: User
});

var Flight = new mongoose.Schema({
        airline: String,
        date: String,
        flightNum: String,
        terminal: String,
	user: User
});

Flight.plugin(URLSlugs('flightNum'));

var Hotel = new mongoose.Schema({
        name: String,
        address: String,
        chInDate: String,
        chOutDate: String,
	user: User
});

Hotel.plugin(URLSlugs('name'));



var Trip = new mongoose.Schema({
        name: String,
        destination: String,
        flights: [Flight],
        hotels: [Hotel],
	user: User
});

Trip.plugin(URLSlugs('name'));

var ToDoList = new mongoose.Schema({
        items: [Item],
        trip: Trip
});




mongoose.model('Item', Item);
mongoose.model('ToDoList', ToDoList);
mongoose.model('Hotel', Hotel);
mongoose.model('Flight', Flight);
mongoose.model('User', User);
mongoose.model('Trip', Trip);

	


mongoose.connect('mongodb://localhost/triphub');
